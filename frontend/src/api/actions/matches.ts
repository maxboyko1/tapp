import {
    FETCH_MATCHES_SUCCESS,
    FETCH_ONE_MATCH_SUCCESS,
    UPSERT_ONE_MATCH_SUCCESS,
    DELETE_ONE_MATCH_SUCCESS,
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
import type { Match, RawMatch } from "../defs/types";
import { activeSessionSelector } from "./sessions";
import { activeRoleSelector } from "./users";
import { matchesReducer } from "../reducers/matches";
import { createSelector } from "reselect";
import { applicantsSelector } from "./applicants";
import { positionsSelector } from "./positions";

// actions
export const fetchMatchesSuccess = actionFactory<RawMatch[]>(
    FETCH_MATCHES_SUCCESS
);
const fetchOneMatchSuccess = actionFactory<RawMatch>(FETCH_ONE_MATCH_SUCCESS);
const upsertOneMatchSuccess = actionFactory<RawMatch>(UPSERT_ONE_MATCH_SUCCESS);
const deleteOneMatchSuccess = actionFactory<RawMatch>(DELETE_ONE_MATCH_SUCCESS);

const applicantToApplicantId = flattenIdFactory<"applicant", "applicant_id">(
    "applicant",
    "applicant_id"
);
const positionToPositionId = flattenIdFactory<"position", "position_id">(
    "position",
    "position_id"
);

function prepForApi(data: Partial<Match>) {
    return positionToPositionId(
        applicantToApplicantId(data)
    ) as Partial<RawMatch>;
}

// dispatchers
export const fetchMatches = validatedApiDispatcher<RawMatch[], []>({
    name: "fetchMatches",
    description: "Fetch matches",
    onErrorDispatch: (e) => fetchError(e.toString()),
    dispatcher: () => async (dispatch, getState) => {
        const role = activeRoleSelector(getState());
        const activeSession = activeSessionSelector(getState());
        if (activeSession == null) {
            throw Error("Cannot fetch Matches without an active session");
        }
        const { id: activeSessionId } = activeSession;
        const data = (await apiGET(
            `/${role}/sessions/${activeSessionId}/matches`
        )) as RawMatch[];
        // Between the time we started fetching and the time the data arrived, the active session may have
        // changed. Make sure the correct active session is set before updating the data.
        if (isSameSession(activeSessionId, getState)) {
            dispatch(fetchMatchesSuccess(data));
        }
        return data;
    },
});

export const fetchMatch = validatedApiDispatcher<RawMatch, [HasId]>({
    name: "fetchMatch",
    description: "Fetch match",
    onErrorDispatch: (e) => fetchError(e.toString()),
    dispatcher: (payload: HasId) => async (dispatch, getState) => {
        const role = activeRoleSelector(getState());
        const activeSession = activeSessionSelector(getState());
        if (activeSession == null) {
            throw new Error("Cannot fetch Matches without an active session");
        }
        const { id: activeSessionId } = activeSession;
        const data = (await apiGET(
            `/${role}/sessions/${activeSessionId}/matches/${payload.id}`
        )) as RawMatch;
        dispatch(fetchOneMatchSuccess(data));
        return data;
    },
});

export const upsertMatch = validatedApiDispatcher<
    RawMatch,
    [Partial<Match>]
>({
    name: "upsertMatch",
    description: "Add/insert match",
    onErrorDispatch: (e) => upsertError(e.toString()),
    dispatcher: (payload: Partial<Match>) => async (dispatch, getState) => {
        const role = activeRoleSelector(getState());
        const data = (await apiPOST(
            `${role}/matches`,
            prepForApi(payload)
        )) as RawMatch;
        dispatch(upsertOneMatchSuccess(data));
        return data;
    },
});

export const deleteMatch = validatedApiDispatcher<void, [Pick<Match, "applicant" | "position">]>({
    name: "deleteMatch",
    description: "Delete match",
    onErrorDispatch: (e) => deleteError(e.toString()),
    dispatcher:
        (payload: Pick<Match, "applicant" | "position">) =>
        async (dispatch, getState) => {
            const role = activeRoleSelector(getState());
            const data = (await apiPOST(
                `/${role}/matches/delete`,
                prepForApi(payload)
            )) as RawMatch;
            dispatch(deleteOneMatchSuccess(data));
        },
});

// selectors

// Each reducer is given an isolated state; instead of needed to remember to
// pass the isolated state to each selector, `reducer._localStoreSelector` will intelligently
// search for and return the isolated state associated with `reducer`. This is not
// a standard redux function.
const localStoreSelector = matchesReducer._localStoreSelector;
const _matchesSelector = createSelector(
    localStoreSelector,
    (state) => state._modelData
);

export const matchesSelector = createSelector(
    [_matchesSelector, applicantsSelector, positionsSelector],
    (matches, applicants, positions) => {
        const applicantsById = arrayToHash(applicants);
        const positionsById = arrayToHash(positions);
        return matches
            .map((match) => {
                const { position_id, applicant_id, ...rest } = match;
                return {
                    ...rest,
                    position: positionsById[position_id] || {},
                    applicant: applicantsById[applicant_id] || {},
                } as Match;
            })
            .filter(
                (match) =>
                    match.position.id != null && match.applicant.id != null
            );
    }
);
