import {
    UPSERT_ONE_WAGE_CHUNK_SUCCESS,
    DELETE_ONE_WAGE_CHUNK_SUCCESS,
    FETCH_WAGE_CHUNKS_FOR_ASSIGNMENT_SUCCESS,
    UPSERT_WAGE_CHUNKS_FOR_ASSIGNMENT_SUCCESS,
} from "../constants";
import { fetchError, upsertError, deleteError } from "./errors";
import { actionFactory, HasId, validatedApiDispatcher } from "./utils";
import { apiGET, apiPOST } from "../../libs/api-utils";
import { createSelector } from "reselect";
import { assignmentsReducer } from "../reducers/assignments";
import { fetchAssignment } from "./assignments";
import { activeRoleSelector } from "./users";
import {
    Assignment,
    RawAssignment,
    RawWageChunk,
    WageChunk,
} from "../defs/types";

// actions
const fetchWageChunksForAssignmentSuccess = actionFactory<RawWageChunk[]>(
    FETCH_WAGE_CHUNKS_FOR_ASSIGNMENT_SUCCESS
);
const upsertWageChunksForAssignmentSuccess = actionFactory<RawWageChunk[]>(
    UPSERT_WAGE_CHUNKS_FOR_ASSIGNMENT_SUCCESS
);
const upsertOneWageChunkSuccess = actionFactory<RawWageChunk>(
    UPSERT_ONE_WAGE_CHUNK_SUCCESS
);
const deleteOneWageChunkSuccess = actionFactory<RawWageChunk>(
    DELETE_ONE_WAGE_CHUNK_SUCCESS
);

// dispatchers
export const fetchWageChunksForAssignment = validatedApiDispatcher({
    name: "fetchWageChunksForAssignment",
    description: "Fetch wage chunks associated with an assignment",
    onErrorDispatch: (e) => fetchError(e.toString()),
    dispatcher: (payload: HasId) => {
        return async (dispatch, getState) => {
            const role = activeRoleSelector(getState());
            // When we fetch wage chunks for an assignment, we only get the wage chunks for that particular assignment
            const { id: assignmentId } = payload;
            const data = (await apiGET(
                `/${role}/assignments/${assignmentId}/wage_chunks`
            )) as RawWageChunk[];
            dispatch(fetchWageChunksForAssignmentSuccess(data));
        };
    },
});

export const upsertWageChunksForAssignment = validatedApiDispatcher({
    name: "upsertWageChunksForAssignment",
    description: "Fetch wage chunks associated with an assignment",
    onErrorDispatch: (e) => fetchError(e.toString()),
    dispatcher: (assignment: Assignment | RawAssignment, payload: WageChunk[]) => {
        return async (dispatch, getState) => {
            const role = activeRoleSelector(getState());
            // When we fetch wage chunks for an assignment, we only get the wage chunks for that particular assignment
            const { id: assignmentId } = assignment;
            const data = (await apiPOST(
                `/${role}/assignments/${assignmentId}/wage_chunks`,
                payload
            )) as RawWageChunk[];
            dispatch(upsertWageChunksForAssignmentSuccess(data));
            // After we update a wage chunk, we should refetch the assignment to make sure
            // there isn't stale data
            await dispatch(fetchAssignment(assignment));
        };
    },
});

export const upsertWageChunk = validatedApiDispatcher({
    name: "upsertWageChunk",
    description: "Add/insert wage chunk",
    onErrorDispatch: (e) => upsertError(e.toString()),
    dispatcher: (payload: WageChunk) => {
        return async (dispatch, getState) => {
            const role = activeRoleSelector(getState());
            const data = await apiPOST(`/${role}/wage_chunks`, payload);
            dispatch(upsertOneWageChunkSuccess(data));
        };
    },
});

export const deleteWageChunk = validatedApiDispatcher({
    name: "deleteWageChunk",
    description: "Delete a wage chunk",
    onErrorDispatch: (e) => deleteError(e.toString()),
    dispatcher: (payload: HasId) => {
        return async (dispatch, getState) => {
            const role = activeRoleSelector(getState());
            const data = await apiPOST(`/${role}/wage_chunks/delete`, payload);
            dispatch(deleteOneWageChunkSuccess(data));
        };
    },
});

// selectors

// Each reducer is given an isolated state; instead of needed to remember to
// pass the isolated state to each selector, `reducer._localStoreSelector` will intelligently
// search for and return the isolated state associated with `reducer`. This is not
// a standard redux function.

// wage chunk data is stored with the assignments in the redux store
const localStoreSelector = assignmentsReducer._localStoreSelector;
export const wageChunksByAssignmentSelector = createSelector(
    localStoreSelector,
    (state) =>
        function (assignment: Assignment | RawAssignment) {
            const assignment_id = assignment.id;
            if (!state._wageChunksByAssignmentId[assignment_id]) {
                return [];
            }
            return state._wageChunksByAssignmentId[
                assignment_id
            ] as WageChunk[];
        }
);
