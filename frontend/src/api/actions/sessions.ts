import { createSelector } from "reselect";
import {
    FETCH_SESSIONS_SUCCESS,
    FETCH_ONE_SESSION_SUCCESS,
    UPSERT_ONE_SESSION_SUCCESS,
    DELETE_ONE_SESSION_SUCCESS,
    SET_ACTIVE_SESSION,
} from "../constants";
import { fetchError, upsertError, deleteError, apiError } from "./errors";
import { actionFactory, flattenIdFactory, HasId, validatedApiDispatcher } from "./utils";
import { apiGET, apiPOST } from "../../libs/api-utils";
import { sessionsReducer } from "../reducers/sessions";
import { activeRoleSelector } from "./users";
import { clearSessionDependentData, initFromStage } from "./init";
import type { RawSession, Session } from "../defs/types";

function toInternalSessions(rawSessions: RawSession[]): Session[] {
    const sessionsById: Record<number, Session> = {};

    rawSessions.forEach((rawSession) => {
        const { hours_ref_session_id: _hoursRefSessionId, ...sessionData } = rawSession;
        sessionsById[sessionData.id] = {
            ...sessionData,
            hours_ref_session: null,
        };
    });

    rawSessions.forEach((rawSession) => {
        sessionsById[rawSession.id].hours_ref_session =
            rawSession.hours_ref_session_id == null
                ? null
                : sessionsById[rawSession.hours_ref_session_id] || null;
    });

    return rawSessions.map((rawSession) => sessionsById[rawSession.id]);
}

function toInternalSession(rawSession: RawSession, existingSessions: Session[]): Session {
    const existingById: Record<number, Session> = Object.fromEntries(
        existingSessions.map((session) => [session.id, session])
    );
    const { hours_ref_session_id, ...sessionData } = rawSession;

    return {
        ...sessionData,
        hours_ref_session:
            hours_ref_session_id == null ? null : existingById[hours_ref_session_id] || null,
    };
}

// actions
export const fetchSessionsSuccess = actionFactory<Session[]>(
    FETCH_SESSIONS_SUCCESS
);
const fetchOneSessionSuccess = actionFactory<Session>(
    FETCH_ONE_SESSION_SUCCESS
);
const upsertOneSessionSuccess = actionFactory<Session>(
    UPSERT_ONE_SESSION_SUCCESS
);
const deleteOneSessionSuccess = actionFactory<Session>(
    DELETE_ONE_SESSION_SUCCESS
);
const setActiveSessionAction = actionFactory<Session | null>(
    SET_ACTIVE_SESSION
);

const hoursRefSessionToHoursRefSessionId = flattenIdFactory<
    "hours_ref_session",
    "hours_ref_session_id"
>("hours_ref_session", "hours_ref_session_id");

function prepForApi(data: Partial<Session>) {
    const flattened =
        hoursRefSessionToHoursRefSessionId({ ...data }) as Partial<RawSession> & {
            hours_ref_session?: Session | null;
        };

    // flattenIdFactory does not map null object refs to *_id, so handle null explicitly.
    if (Object.hasOwnProperty.call(flattened, "hours_ref_session")) {
        flattened.hours_ref_session_id = flattened.hours_ref_session?.id ?? null;
        delete flattened.hours_ref_session;
    }

    return flattened;
}

// dispatchers
export const fetchSessions = validatedApiDispatcher({
    name: "fetchSessions",
    description: "Fetch sessions",
    onErrorDispatch: (e) => fetchError(e.toString()),
    dispatcher: () => async (dispatch, getState) => {
        try {
            const role = activeRoleSelector(getState());
            const data = (await apiGET(`/${role}/sessions`)) as RawSession[];
            const internalSessions = toInternalSessions(data);
            dispatch(fetchSessionsSuccess(internalSessions));
            return internalSessions;
        } catch {
            dispatch(fetchSessionsSuccess([]));
            return [];
        }
    },
});

export const fetchSession = validatedApiDispatcher<Session, [HasId]>({
    name: "fetchSession",
    description: "Fetch session",
    onErrorDispatch: (e) => fetchError(e.toString()),
    dispatcher: (payload: HasId) => async (dispatch, getState) => {
        const role = activeRoleSelector(getState());
        const data = (await apiGET(
            `/${role}/sessions/${payload.id}`
        )) as RawSession;
        const existingSessions = sessionsSelector(getState());
        const internalSession = toInternalSession(data, existingSessions);
        dispatch(fetchOneSessionSuccess(internalSession));
        return internalSession;
    },
});

export const upsertSession = validatedApiDispatcher<
    Session,
    [Partial<Session>]
>({
    name: "upsertSession",
    description: "Add/insert session",
    onErrorDispatch: (e) => upsertError(e.toString()),
    dispatcher: (payload: Partial<Session>) => async (dispatch, getState) => {
        const role = activeRoleSelector(getState());
        const data = (await apiPOST(
            `/${role}/sessions`,
            prepForApi(payload)
        )) as RawSession;
        const existingSessions = sessionsSelector(getState());
        const internalSession = toInternalSession(data, existingSessions);
        dispatch(upsertOneSessionSuccess(internalSession));
        return internalSession;
    },
});

export const deleteSession = validatedApiDispatcher<void, [Partial<Session>]>({
    name: "deleteSession",
    description: "Delete session",
    onErrorDispatch: (e) => deleteError(e.toString()),
    dispatcher: (payload: Partial<Session>) => async (dispatch, getState) => {
        const role = activeRoleSelector(getState());
        const data = (await apiPOST(
            `/${role}/sessions/delete`,
            prepForApi(payload)
        )) as RawSession;
        const existingSessions = sessionsSelector(getState());
        const internalSession = toInternalSession(data, existingSessions);
        dispatch(deleteOneSessionSuccess(internalSession));
    },
});

/**
 * Sets the `activeSession`. `activeSession` is used
 * in other API calls, so changing the active session may
 * trigger changes in other data (for example, `instructors` or `positions`)
 *
 * @param {object} payload - The session to set active
 */
export const setActiveSession = validatedApiDispatcher<
    void,
    [Session | null, {skipInit?: boolean}?]
>({
    name: "setActiveSession",
    description: "Set the active session",
    onErrorDispatch: (e) => apiError(e.toString()),
    dispatcher:
        (payload: Session | null, options: { skipInit?: boolean } = {}) => {
            return async (dispatch, getState) => {
                const { skipInit } = options;
                const state = getState();
                const currentActiveSession = activeSessionSelector(state);
                if (currentActiveSession === payload) {
                    return;
                }
                // passing in null will unset the active session
                if (payload == null) {
                    dispatch(setActiveSessionAction(null));
                    dispatch(clearSessionDependentData());
                    return;
                }
                if ((currentActiveSession || { id: null }).id === payload.id) {
                    return;
                }
                // If we made it here, the activeSession is changing.
                dispatch(setActiveSessionAction(payload));
                // Make sure all tasks we depend on get run
                if (!skipInit) {
                    await dispatch(
                        initFromStage("setActiveSession", { startAfterStage: true })
                    );
                }
            };
        }
});

// selectors
const localStoreSelector = sessionsReducer._localStoreSelector;
export const sessionsSelector = createSelector(
    localStoreSelector,
    (state) => state._modelData as Session[]
);

export const activeSessionSelector = createSelector(
    localStoreSelector,
    (state) => state.activeSession as Session | null
);
