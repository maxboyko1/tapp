import {
    FETCH_ACTIVE_USER_SUCCESS,
    FETCH_USERS_SUCCESS,
    UPSERT_USERS_SUCCESS,
    SET_ACTIVE_USER_ROLE_SUCCESS,
} from "../constants";
import { fetchError, upsertError, deleteError } from "./errors";
import { actionFactory, validatedApiDispatcher } from "./utils";
import { apiGET, apiPOST } from "../../libs/api-utils";
import { usersReducer } from "../reducers/users";
import { initFromStage } from "./init";
import type { ActiveUser, User, UserRole } from "../defs/types";
import { RootState } from "../../rootReducer";
import { globalsSelector, setGlobals } from ".";

// actions
const fetchActiveUserSuccess = actionFactory<ActiveUser>(
    FETCH_ACTIVE_USER_SUCCESS
);
const fetchUsersSuccess = actionFactory<User[]>(FETCH_USERS_SUCCESS);
const upsertUserSuccess = actionFactory<User>(UPSERT_USERS_SUCCESS);
const setActiveUserRoleSuccess = actionFactory<UserRole | null>(
    SET_ACTIVE_USER_ROLE_SUCCESS
);

/**
 * Determines whether `role` is a valid UserRole.
 */
function isValidRole(role: any): role is UserRole {
    if (typeof role !== "string") {
        return false;
    }
    if (["admin", "instructor", "ta"].includes(role)) {
        return true;
    }
    return false;
}

// dispatchers
export const fetchActiveUser = validatedApiDispatcher<ActiveUser, []>({
    name: "fetchActiveUser",
    description: "Fetch the active user",
    onErrorDispatch: (e) => fetchError(e.toString()),
    dispatcher: () => {
        return async (dispatch, getState) => {
            const data = (await apiGET(`/active_user`)) as ActiveUser;
            dispatch(fetchActiveUserSuccess(data));
            // If our currently-set role is one that we don't have,
            // set our role to one we do have.
            const currentRole =
                activeRoleSelector(getState()) || globalsSelector(getState()).role;
            if (isValidRole(currentRole)) {
                await dispatch(setActiveUserRole(currentRole));
            } else if (data.roles?.length > 0) {
                // If there is no currentRole that could be retrieved from
                // the state, set the role to the "highest" available.
                await dispatch(setActiveUserRole(data.roles[0]));
            }
            return data;
        };
    },
});

export const upsertUser = validatedApiDispatcher({
    name: "upsertUsers",
    description: "Upserts a user (setting their role(s))",
    onErrorDispatch: (e) => fetchError(e.toString()),
    dispatcher: (user) => {
        return async (dispatch) => {
            const data = await apiPOST(`/admin/users`, user);
            dispatch(upsertUserSuccess(data));
            await dispatch(fetchUsers());
        };
    },
});

export const fetchUsers = validatedApiDispatcher<User[], []>({
    name: "fetchUsers",
    description: "Fetch all users",
    onErrorDispatch: (e) => upsertError(e.toString()),
    dispatcher: () => {
        return async (dispatch, getState) => {
            const role = activeRoleSelector(getState());
            const data = (await apiGET(`/${role}/users`)) as User[];
            dispatch(fetchUsersSuccess(data));
            return data;
        };
    },
});

export const setActiveUserRole = validatedApiDispatcher({
    name: "setActiveUserRole",
    description: "Sets the role of the active user",
    onErrorDispatch: (e) => deleteError(e.toString()),
    dispatcher: (payload: UserRole | null, options: { skipInit?: boolean } = {}) => {
        return async (dispatch) => {
            if (payload) {
                dispatch(setGlobals({ role: payload }));
            }
            dispatch(setActiveUserRoleSuccess(payload));
            if (!options.skipInit) {
                await dispatch(
                    initFromStage("setActiveUserRole", {
                        startAfterStage: true,
                    })
                );
            }
        }; 
    },
});

export const debugOnlyFetchUsers = validatedApiDispatcher({
    name: "debugOnlyFetchUsers",
    description:
        "Fetch all users; this is available only in debug mode and bypasses any user permissions",
    onErrorDispatch: (e) => upsertError(e.toString()),
    dispatcher: () => {
        return async (dispatch) => {
            const data = (await apiGET(`/debug/users`)) as User[];
            dispatch(fetchUsersSuccess(data));
        };
    },
});

export const debugOnlyUpsertUser = validatedApiDispatcher({
    name: "debugOnlyUpsertUser",
    description: "Upsert a user",
    onErrorDispatch: (e) => upsertError(e.toString()),
    dispatcher: (user: User | Omit<User, "id">) => {
        return async (dispatch) => {
            const data = (await apiPOST(`/debug/users`, user)) as User;
            return dispatch(upsertUserSuccess(data));
        };
    },
});

export const debugOnlySetActiveUser = validatedApiDispatcher({
    name: "debugOnlySetActiveUser",
    description:
        "Sets the active user (i.e. fakes the 'logged on' user); available only in debug mode",
    onErrorDispatch: (e) => fetchError(e.toString()),
    dispatcher:
        (user, options: { skipInit?: boolean } = {}) =>
        async (dispatch) => {
            const data = (await apiPOST(
                `/debug/active_user`,
                user
            )) as ActiveUser;
            dispatch(fetchActiveUserSuccess(data));
            // The new user we switch to might not have the same roles as the previous user.
            // Default to the highest-authority role available, which is the first in the list.
            dispatch(setActiveUserRoleSuccess(data.roles[0]));

            // After the active user has been set, we need to re-download (almost) all data
            // with the permissions of the new active user.
            if (!options.skipInit) {
                await dispatch(initFromStage("setActiveUser"));
            }
        },
});

// selectors

// Each reducer is given an isolated state; instead of needed to remember to
// pass the isolated state to each selector, `reducer._localStoreSelector` will intelligently
// search for and return the isolated state associated with `reducer`. This is not
// a standard redux function.
const localStoreSelector = usersReducer._localStoreSelector;
export const usersSelector = (state: RootState) =>
    localStoreSelector(state).users;
export const activeUserSelector = (state: RootState) =>
    localStoreSelector(state).active_user;
export const activeRoleSelector = (state: RootState) =>
    localStoreSelector(state).active_role;
