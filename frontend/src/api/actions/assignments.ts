import {
    FETCH_ASSIGNMENTS_SUCCESS,
    FETCH_ONE_ASSIGNMENT_SUCCESS,
    UPSERT_ONE_ASSIGNMENT_SUCCESS,
    DELETE_ONE_ASSIGNMENT_SUCCESS,
} from "../constants";
import { fetchError, upsertError, deleteError } from "./errors";
import {
    actionFactory,
    validatedApiDispatcher,
    arrayToHash,
    flattenIdFactory,
    HasId,
    isSameSession,
} from "./utils";
import { apiGET, apiPOST } from "../../libs/api-utils";
import { assignmentsReducer } from "../reducers/assignments";
import { createSelector } from "reselect";
import { applicantsSelector } from "./applicants";
import { positionsSelector } from "./positions";
import { activeRoleSelector } from "./users";
import {
    fetchWageChunksForAssignment,
    wageChunksByAssignmentSelector,
    upsertWageChunksForAssignment,
} from "./wage_chunks";
import type { RawAssignment, Assignment, WageChunk } from "../defs/types";
import { activeSessionSelector } from "./sessions";
import { ExportFormat, PrepareDataFunc } from "../../libs/import-export";
import { splitDateRangeAtNewYear } from "../mockAPI/utils";

// actions
export const fetchAssignmentsSuccess = actionFactory<RawAssignment[]>(
    FETCH_ASSIGNMENTS_SUCCESS
);
const fetchOneAssignmentSuccess = actionFactory<RawAssignment>(
    FETCH_ONE_ASSIGNMENT_SUCCESS
);
const upsertOneAssignmentSuccess = actionFactory<RawAssignment>(
    UPSERT_ONE_ASSIGNMENT_SUCCESS
);
const deleteOneAssignmentSuccess = actionFactory<RawAssignment>(
    DELETE_ONE_ASSIGNMENT_SUCCESS
);

const MissingActiveSessionError = new Error(
    "Cannot interact with Assignments without an active session"
);

// dispatchers
export const fetchAssignments = validatedApiDispatcher<RawAssignment[], []>({
    name: "fetchAssignments",
    description: "Fetch assignments",
    onErrorDispatch: (e) => fetchError(e.toString()),
    dispatcher: () => async (dispatch, getState) => {
        const role = activeRoleSelector(getState());
        const activeSession = activeSessionSelector(getState());
        if (activeSession == null) {
            throw MissingActiveSessionError;
        }
        const { id: activeSessionId } = activeSession;
        const data = (await apiGET(
            `/${role}/sessions/${activeSessionId}/assignments`
        )) as RawAssignment[];
        // Between the time we started fetching and the time the data arrived, the active session may have
        // changed. Make sure the correct active session is set before updating the data.
        if (isSameSession(activeSessionId, getState)) {
            dispatch(fetchAssignmentsSuccess(data));
        }
        return data;
    },
});

export const fetchAssignment = validatedApiDispatcher<RawAssignment, [HasId]>({
    name: "fetchAssignment",
    description: "Fetch assignment",
    onErrorDispatch: (e) => fetchError(e.toString()),
    dispatcher: (payload: HasId) => {
        return async (dispatch, getState) => {
            const role = activeRoleSelector(getState());
            const data = (await apiGET(
                `/${role}/assignments/${payload.id}`
            )) as RawAssignment;
            dispatch(fetchOneAssignmentSuccess(data));
            return data;
        };
    },
});

// Some helper functions to convert the data that the UI uses
// into data that the API can use
const applicantToApplicantId = flattenIdFactory<"applicant", "applicant_id">(
    "applicant",
    "applicant_id"
);
const positionToPositionId = flattenIdFactory<"position", "position_id">(
    "position",
    "position_id"
);
function prepForApi(data: Partial<Assignment>) {
    return positionToPositionId(
        applicantToApplicantId(data)
    ) as Partial<RawAssignment>;
}

export const upsertAssignment = validatedApiDispatcher<
    RawAssignment,
    [Omit<Partial<Assignment>, "wage_chunks"> & { wage_chunks?: Partial<WageChunk>[] }]
>({
    name: "upsertAssignment",
    description: "Add/insert assignment",
    onErrorDispatch: (e) => upsertError(e.toString()),
    dispatcher:
        (payload) => async (dispatch, getState) => {
            // Prepare wageChunksPayload
            const activeSession = activeSessionSelector(getState());
            let wageChunksPayload: Partial<WageChunk>[] | undefined = payload.wage_chunks;
            if (!wageChunksPayload) {
                const { start_date, end_date, hours } = payload;
                if (start_date && end_date && typeof hours === "number") {
                    const splitRanges = splitDateRangeAtNewYear(start_date, end_date);
                    if (splitRanges.length === 2) {
                        const chunk1 = hours / 2;
                        wageChunksPayload = [
                            {
                                start_date: splitRanges[0].start_date,
                                end_date: splitRanges[0].end_date,
                                hours: chunk1,
                                rate: activeSession?.rate1,
                            },
                            {
                                start_date: splitRanges[1].start_date,
                                end_date: splitRanges[1].end_date,
                                hours: hours - chunk1,
                                rate: activeSession?.rate2 ?? undefined,
                            },
                        ];
                    } else if (splitRanges.length === 1) {
                        wageChunksPayload = [
                            {
                                start_date: splitRanges[0].start_date,
                                end_date: splitRanges[0].end_date,
                                hours: hours,
                                rate: activeSession?.rate1,
                            },
                        ];
                    }
                }
            }

            // Prepare assignmentPayload (no wage_chunks)
            const assignmentPayload = { ...payload };
            delete assignmentPayload.wage_chunks;

            const role = activeRoleSelector(getState());
            let data = (await apiPOST(
                `/${role}/assignments`,
                prepForApi(assignmentPayload as Partial<Assignment>)
            )) as RawAssignment;

            if (wageChunksPayload) {
                await dispatch(upsertWageChunksForAssignment(data, wageChunksPayload));
                data = await dispatch(fetchAssignment(data));
            } else {
                data = await dispatch(fetchAssignment(data));
            }
            dispatch(upsertOneAssignmentSuccess(data));
            return data;
        },
});

export const deleteAssignment = validatedApiDispatcher<void, [HasId]>({
    name: "deleteAssignment",
    description: "Delete assignment",
    onErrorDispatch: (e) => deleteError(e.toString()),
    dispatcher: (payload: HasId) => async (dispatch, getState) => {
        const role = activeRoleSelector(getState());
        const data = await apiPOST(
            `/${role}/assignments/delete`,
            prepForApi(payload)
        );
        dispatch(deleteOneAssignmentSuccess(data));
    },
});

export const exportAssignments = validatedApiDispatcher<
    Blob,
    [PrepareDataFunc<Assignment>, ExportFormat]
>({
    name: "exportAssignments",
    description: "Export assignments",
    onErrorDispatch: (e) => fetchError(e.toString()),
    dispatcher:
        (
            formatter: PrepareDataFunc<Assignment>,
            format: ExportFormat = "spreadsheet"
        ) =>
        async (dispatch, getState) => {
            if (!(formatter instanceof Function)) {
                throw new Error(
                    `"formatter" must be a function when using the export action.`
                );
            }
            // Re-fetch all assignments from the server in case things happened to be out of sync.
            await dispatch(fetchAssignments());
            const assignments = assignmentsSelector(getState());

            // Normally, wage chunk information is not fetched with an assignment. This information
            // must be fetched separately.
            const wageChunkPromises = assignments.map((assignment) =>
                dispatch(fetchWageChunksForAssignment(assignment))
            );
            await Promise.all(wageChunkPromises);
            // Attach the wage chunk information to each assignment
            for (const assignment of assignments) {
                assignment.wage_chunks = wageChunksByAssignmentSelector(
                    getState()
                )(assignment);
            }

            return formatter(assignments, format);
        },
});

export const upsertAssignments = validatedApiDispatcher<
    void,
    [Partial<Assignment>[]]
>({
    name: "upsertAssignments",
    description: "Upsert a list of assignments",
    onErrorDispatch: (e) => fetchError(e.toString()),
    dispatcher: (assignments: Partial<Assignment>[]) => async (dispatch) => {
        if (assignments.length === 0) {
            return;
        }
        const dispatchers = assignments.map((assignment) =>
            dispatch(upsertAssignment(assignment))
        );
        await Promise.all(dispatchers);
        // Re-fetch all assignments from the server in case things happened to be out of sync.
        await dispatch(fetchAssignments());
    },
});

// selectors

/**
 * Returns whether the number of hours for the `assignment` and the sum
 * total hours of `wageChunks` match.
 *
 * @param {*} assignment
 * @param {*} wageChunks
 * @returns
 */
function wageChunksMatchAssignment(
    assignment: RawAssignment,
    wageChunks: WageChunk[]
) {
    if (!wageChunks) {
        return true;
    }
    let totalHours = 0;
    for (const chunk of wageChunks) {
        totalHours += chunk.hours;
    }
    return totalHours === assignment.hours;
}

// Each reducer is given an isolated state; instead of needing to remember to
// pass the isolated state to each selector, `reducer._localStoreSelector` will intelligently
// search for and return the isolated state associated with `reducer`. This is not
// a standard redux function.
const localStoreSelector = assignmentsReducer._localStoreSelector;
/**
 * Get just the assignment data as it appears in the store; i.e., it has references to
 * id's of applicants and positions.
 */
const _assignmentsSelector = createSelector(
    localStoreSelector,
    (state) => state._modelData
);
const _offersByAssignmentIdSelector = createSelector(
    localStoreSelector,
    (state) => state._offersByAssignmentId
);
/**
 * Get the current assignments. This selector is memoized and will only
 * be recomputed when assignments, applicants, or positions change. If wageChunks
 * have been loaded for the assignment, they are included, otherwise they are null.
 */
export const assignmentsSelector = createSelector(
    [
        _assignmentsSelector,
        applicantsSelector,
        positionsSelector,
        wageChunksByAssignmentSelector,
        _offersByAssignmentIdSelector,
    ],
    (
        assignments,
        applicants,
        positions,
        getWageChunksForAssignment,
        offersByAssignmentIdHash
    ) => {
        if (assignments.length === 0) {
            return [];
        }
        const applicantsById = arrayToHash(applicants);
        const positionsById = arrayToHash(positions);
        return (
            assignments
                .map((assignment) => {
                    const { position_id, applicant_id, ...rest } = assignment;
                    const wage_chunks = getWageChunksForAssignment(assignment);
                    const offers = offersByAssignmentIdHash[assignment.id];
                    return {
                        ...rest,
                        position: positionsById[position_id] || {},
                        applicant: applicantsById[applicant_id] || {},
                        // Only return wage chunks if they match the current assignment. This
                        // ensures stale (previously-loaded) wage chunks don't get served.
                        wage_chunks: wageChunksMatchAssignment(
                            assignment,
                            wage_chunks
                        )
                            ? wage_chunks
                            : null,
                        offers,
                    } as Assignment;
                })
                // There could be a race condition where the assignments are loaded before applicants and positions.
                // We filter out any assignments that don't have a corresponding applicant and position.
                .filter((assignment) => {
                    return (
                        assignment.position.id != null &&
                        assignment.applicant.id != null
                    );
                })
        );
    }
);
