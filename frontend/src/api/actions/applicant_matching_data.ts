import {
    FETCH_APPLICANT_MATCHING_DATA_SUCCESS,
    FETCH_ONE_APPLICANT_MATCHING_DATUM_SUCCESS,
    UPSERT_ONE_APPLICANT_MATCHING_DATUM_SUCCESS,
    DELETE_ONE_APPLICANT_MATCHING_DATUM_SUCCESS,
} from "../constants";
import { fetchError, upsertError, deleteError } from "./errors";
import {
    actionFactory,
    validatedApiDispatcher,
    flattenIdFactory,
    HasId,
    isSameSession,
    arrayToHash,
} from "./utils";
import { apiGET, apiPOST } from "../../libs/api-utils";
import type {
    ApplicantMatchingDatum,
    RawApplicantMatchingDatum,
} from "../defs/types";
import { activeSessionSelector } from "./sessions";
import { activeRoleSelector } from "./users";
import { applicantMatchingDataReducer } from "../reducers/applicant_matching_data";
import { createSelector } from "reselect";
import { applicantsSelector } from "./applicants";
import { ExportFormat, PrepareDataFunc } from "../../libs/import-export";

// actions
export const fetchApplicantMatchingDataSuccess = actionFactory<
    RawApplicantMatchingDatum[]
>(FETCH_APPLICANT_MATCHING_DATA_SUCCESS);
const fetchOneApplicantMatchingDatumSuccess =
    actionFactory<RawApplicantMatchingDatum>(
        FETCH_ONE_APPLICANT_MATCHING_DATUM_SUCCESS
    );
const upsertOneApplicantMatchingDatumSuccess =
    actionFactory<RawApplicantMatchingDatum>(
        UPSERT_ONE_APPLICANT_MATCHING_DATUM_SUCCESS
    );
const deleteOneApplicantMatchingDatumSuccess =
    actionFactory<RawApplicantMatchingDatum>(
        DELETE_ONE_APPLICANT_MATCHING_DATUM_SUCCESS
    );

const applicantToApplicantId = flattenIdFactory<"applicant", "applicant_id">(
    "applicant",
    "applicant_id"
);
const sessionToSessionId = flattenIdFactory<"session", "session_id">(
    "session",
    "session_id"
);

function prepForApi(data: Partial<ApplicantMatchingDatum>) {
    return sessionToSessionId(
        applicantToApplicantId(data)
    ) as Partial<RawApplicantMatchingDatum>;
}

// dispatchers
export const fetchApplicantMatchingData = validatedApiDispatcher({
    name: "fetchApplicantMatchingData",
    description: "Fetch applicant_matching_data",
    onErrorDispatch: (e) => fetchError(e.toString()),
    dispatcher: () => async (dispatch, getState) => {
        const role = activeRoleSelector(getState());
        const activeSession = activeSessionSelector(getState());
        if (activeSession == null) {
            throw Error(
                "Cannot fetch ApplicantMatchingData without an active session"
            );
        }
        const { id: activeSessionId } = activeSession;
        const data = (await apiGET(
            `/${role}/sessions/${activeSessionId}/applicant_matching_data`
        )) as RawApplicantMatchingDatum[];
        // Between the time we started fetching and the time the data arrived, the active session may have
        // changed. Make sure the correct active session is set before updating the data.
        if (isSameSession(activeSessionId, getState)) {
            dispatch(fetchApplicantMatchingDataSuccess(data));
        }
        return data;
    },
});

export const fetchApplicantMatchingDatum = validatedApiDispatcher({
    name: "fetchApplicantMatchingDatum",
    description: "Fetch applicant_matching_datum",
    onErrorDispatch: (e) => fetchError(e.toString()),
    dispatcher: (payload: HasId) => async (dispatch, getState) => {
        const role = activeRoleSelector(getState());
        const activeSession = activeSessionSelector(getState());
        if (activeSession == null) {
            throw new Error(
                "Cannot fetch ApplicantMatchingData without an active session"
            );
        }
        const { id: activeSessionId } = activeSession;
        const data = (await apiGET(
            `/${role}/sessions/${activeSessionId}/applicant_matching_data/${payload.id}`
        )) as RawApplicantMatchingDatum;
        dispatch(fetchOneApplicantMatchingDatumSuccess(data));
        return data;
    },
});

export const upsertApplicantMatchingDatum = validatedApiDispatcher({
    name: "upsertApplicantMatchingDatum",
    description: "Add/insert applicant_matching_datum",
    onErrorDispatch: (e) => upsertError(e.toString()),
    dispatcher:
        (payload: Partial<ApplicantMatchingDatum>) =>
        async (dispatch, getState) => {
            const role = activeRoleSelector(getState());
            const data = (await apiPOST(
                `${role}/applicant_matching_data`,
                prepForApi(payload)
            )) as RawApplicantMatchingDatum;
            dispatch(upsertOneApplicantMatchingDatumSuccess(data));
            return data;
        },
});

export const deleteApplicantMatchingDatum = validatedApiDispatcher({
    name: "deleteApplicantMatchingDatum",
    description: "Delete applicant_matching_datum",
    onErrorDispatch: (e) => deleteError(e.toString()),
    dispatcher:
        (payload: Pick<ApplicantMatchingDatum, "applicant" | "session">) =>
        async (dispatch, getState) => {
            const role = activeRoleSelector(getState());
            const data = (await apiPOST(
                `/${role}/applicant_matching_data/delete`,
                prepForApi(payload)
            )) as RawApplicantMatchingDatum;
            dispatch(deleteOneApplicantMatchingDatumSuccess(data));
        },
});

// selectors

// Each reducer is given an isolated state; instead of needed to remember to
// pass the isolated state to each selector, `reducer._localStoreSelector` will intelligently
// search for and return the isolated state associated with `reducer`. This is not
// a standard redux function.
const localStoreSelector = applicantMatchingDataReducer._localStoreSelector;
const _applicantMatchingDataSelector = createSelector(
    localStoreSelector,
    (state) => state._modelData
);

export const applicantMatchingDataSelector = createSelector(
    [_applicantMatchingDataSelector, applicantsSelector],
    (applicantMatchingData, applicants) => {
        const applicantsById = arrayToHash(applicants);
        return applicantMatchingData
            .map((applicantMatchingDatum) => {
                const { applicant_id, session_id, ...rest } =
                    applicantMatchingDatum;

                return {
                    ...rest,
                    applicant: applicantsById[applicant_id] || {},
                    session: { id: session_id },
                } as ApplicantMatchingDatum;
            })
            .filter(
                (applicantMatchingDatum) =>
                    applicantMatchingDatum.applicant.id != null &&
                    applicantMatchingDatum.session.id != null
            );
    }
);

export const exportAppointments = validatedApiDispatcher({
    name: "exportAppointments",
    description: "Export subsequent appointment guarantees",
    onErrorDispatch: (e) => fetchError(e.toString()),
    dispatcher:
        (
            formatter: PrepareDataFunc<ApplicantMatchingDatum>,
            format: ExportFormat = "spreadsheet"
        ) =>
        async (dispatch, getState) => {
            if (!(formatter instanceof Function)) {
                throw new Error(
                    `"formatter" must be a function when using the export action.`
                );
            }
            // Re-fetch all assignments from the server in case things happened to be out of sync.
            await dispatch(fetchApplicantMatchingData());
            const applicantMatchingData = applicantMatchingDataSelector(
                getState()
            );

            // // Normally, wage chunk information is not fetched with an assignment. This information
            // // must be fetched separately.
            // const wageChunkPromises = assignments.map((assignment) =>
            //     dispatch(fetchWageChunksForAssignment(assignment))
            // );
            // await Promise.all(wageChunkPromises);
            // // Attach the wage chunk information to each assignment
            // for (const assignment of assignments) {
            //     assignment.wage_chunks = wageChunksByAssignmentSelector(
            //         getState()
            //     )(assignment);
            // }

            return formatter(applicantMatchingData, format);
        },
});
