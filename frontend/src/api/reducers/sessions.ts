import {
    FETCH_SESSIONS_SUCCESS,
    FETCH_ONE_SESSION_SUCCESS,
    UPSERT_ONE_SESSION_SUCCESS,
    DELETE_ONE_SESSION_SUCCESS,
    SET_ACTIVE_SESSION,
} from "../constants";
import { createBasicReducerObject, createReducer } from "./utils";
import type { BasicState, HasPayload } from "./utils";
import { Session } from "../defs/types";

export type SessionState = BasicState<Session> & {
    activeSession: Session | null;
};
const initialState: SessionState = {
    _modelData: [] as Session[],
    activeSession: null,
};

// basicReducers is an object whose keys are FETCH_SESSIONS_SUCCESS, etc,
// and values are the corresponding reducer functions
const basicReducers = createBasicReducerObject(
    FETCH_SESSIONS_SUCCESS,
    FETCH_ONE_SESSION_SUCCESS,
    UPSERT_ONE_SESSION_SUCCESS,
    DELETE_ONE_SESSION_SUCCESS
);

export const sessionsReducer = createReducer<SessionState>(initialState, {
    ...basicReducers,
    [SET_ACTIVE_SESSION]: (
        state: SessionState,
        action: HasPayload<Session>
    ): SessionState => ({
        ...state,
        activeSession: action.payload,
    }),
});
