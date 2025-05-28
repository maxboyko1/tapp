import {
    FETCH_LETTER_TEMPLATES_SUCCESS,
    UPSERT_ONE_LETTER_TEMPLATE_SUCCESS,
    DELETE_ONE_LETTER_TEMPLATE_SUCCESS,
    FETCH_ALL_LETTER_TEMPLATES_SUCCESS,
} from "../constants";
import { fetchError, upsertError, deleteError } from "./errors";
import {
    actionFactory,
    HasId,
    isSameSession,
    validatedApiDispatcher,
} from "./utils";
import { apiGET, apiPOST } from "../../libs/api-utils";
import { letterTemplatesReducer } from "../reducers/letter_templates";
import { createSelector } from "reselect";
import { activeRoleSelector } from "./users";
import { bytesToBase64 } from "../mockAPI/utils";
import { activeSessionSelector } from "./sessions";
import {
    LetterTemplate,
    RawAttachment,
    RawLetterTemplate,
} from "../defs/types";

// actions
export const fetchLetterTemplatesSuccess = actionFactory(
    FETCH_LETTER_TEMPLATES_SUCCESS
);
const fetchAllLetterTemplatesSuccess = actionFactory(
    FETCH_ALL_LETTER_TEMPLATES_SUCCESS
);
const upsertOneLetterTemplateSuccess = actionFactory(
    UPSERT_ONE_LETTER_TEMPLATE_SUCCESS
);
const deleteOneLetterTemplateSuccess = actionFactory(
    DELETE_ONE_LETTER_TEMPLATE_SUCCESS
);

const MissingActiveSessionError = new Error(
    "Cannot interact with Appointment Letter Templates without an active session"
);
// dispatchers
export const fetchLetterTemplates = validatedApiDispatcher<RawLetterTemplate[], []>({
    name: "fetchLetterTemplates",
    description: "Fetch letter_templates",
    onErrorDispatch: (e) => fetchError(e.toString()),
    dispatcher: () => async (dispatch, getState) => {
        const role = activeRoleSelector(getState());
        const activeSession = activeSessionSelector(getState());
        if (activeSession == null) {
            throw MissingActiveSessionError;
        }
        const { id: activeSessionId } = activeSession;
        const data = (await apiGET(
            `/${role}/sessions/${activeSessionId}/letter_templates`
        )) as RawLetterTemplate[];
        // Between the time we started fetching and the time the data arrived, the active session may have
        // changed. Make sure the correct active session is set before updating the data.
        if (isSameSession(activeSessionId, getState)) {
            dispatch(fetchLetterTemplatesSuccess(data));
        }
        return data;
    },
});

export const upsertLetterTemplate = validatedApiDispatcher<
    RawLetterTemplate,
    [Partial<LetterTemplate>]
>({
    name: "upsertLetterTemplate",
    description: "Add/insert letter_template",
    onErrorDispatch: (e) => upsertError(e.toString()),
    dispatcher:
        (payload: Partial<LetterTemplate>) => async (dispatch, getState) => {
            const role = activeRoleSelector(getState());
            const activeSession = activeSessionSelector(getState());
            if (activeSession == null) {
                throw MissingActiveSessionError;
            }
            const { id: activeSessionId } = activeSession;
            const data = (await apiPOST(
                `/${role}/sessions/${activeSessionId}/letter_templates`,
                payload
            )) as RawLetterTemplate;
            dispatch(upsertOneLetterTemplateSuccess(data));
            return data;
        },
});

export const deleteLetterTemplate = validatedApiDispatcher<RawLetterTemplate, [HasId]>({
    name: "deleteLetterTemplate",
    description: "Delete letter_template from a session",
    onErrorDispatch: (e) => deleteError(e.toString()),
    dispatcher: (payload: HasId) => async (dispatch, getState) => {
        const role = activeRoleSelector(getState());
        const activeSession = activeSessionSelector(getState());
        if (activeSession == null) {
            throw MissingActiveSessionError;
        }
        const { id: activeSessionId } = activeSession;
        const data = (await apiPOST(
            `/${role}/sessions/${activeSessionId}/letter_templates/delete`,
            payload
        )) as RawLetterTemplate;
        dispatch(deleteOneLetterTemplateSuccess(data));
        return data;
    },
});

export const fetchAllLetterTemplates = validatedApiDispatcher({
    name: "fetchAllLetterTemplates",
    description: "Fetch all available letter_templates",
    onErrorDispatch: (e) => fetchError(e.toString()),
    dispatcher: () => async (dispatch, getState) => {
        const role = activeRoleSelector(getState());
        const data = (await apiGET(
            `/${role}/available_letter_templates`
        )) as { template_file: string }[];
        dispatch(fetchAllLetterTemplatesSuccess(data));
        return data;
    },
});

export const previewLetterTemplate = validatedApiDispatcher<string, [number]>({
    name: "previewLetterTemplate",
    description:
        "Preview the html content of a appointment letter template. No redux state is set by this call, but the contents of the template are returned.",
    onErrorDispatch: (e) => fetchError(e.toString()),
    dispatcher: (template_id: number) => async (_dispatch, getState) => {
        const role = activeRoleSelector(getState());
        const data = (await apiGET(
            `/${role}/letter_templates/${template_id}/view`
        )) as string;
        return data;
    },
});

export const downloadLetterTemplate = validatedApiDispatcher<File, [number]>({
    name: "downloadLetterTemplate",
    description:
        "Download the content of an appointment letter template. No redux state is set by this call, but a `File` object with the contents of the template is returned.",
    onErrorDispatch: (e) => fetchError(e.toString()),
    dispatcher: (template_id: number) => async (_dispatch, getState) => {
        const role = activeRoleSelector(getState());
        const data = (await apiGET(
            `/${role}/letter_templates/${template_id}/download`
        )) as RawAttachment;
        // The data comes in encoded as base64, so we decode it as binary data.
        const content = new Uint8Array(
            atob(data.content)
                .split("")
                .map((x) => x.charCodeAt(0))
        );
        return new File([content], data.file_name, {
            type: data.mime_type,
        });
    },
});

export const uploadLetterTemplate = validatedApiDispatcher<LetterTemplate, [File]>({
    name: "uploadLetterTemplate",
    description: "Upload the `File` object as an appointment letter template",
    onErrorDispatch: (e) => fetchError(e.toString()),
    dispatcher: (file: File) => async (dispatch, getState) => {
        const role = activeRoleSelector(getState());

        // We are expected to upload data in base64, so convert the file
        // object to base64.
        const file_name = file.name;
        const rawContent = new Uint8Array(await file.arrayBuffer());
        const content = bytesToBase64(rawContent);

        const data = await apiPOST(`/${role}/letter_templates/upload`, {
            file_name,
            content,
        });

        dispatch(fetchAllLetterTemplatesSuccess(data));
        return data;
    },
});

// selectors

// Each reducer is given an isolated state; instead of needed to remember to
// pass the isolated state to each selector, `reducer._localStoreSelector` will intelligently
// search for and return the isolated state associated with `reducer`. This is not
// a standard redux function.
const localStoreSelector = letterTemplatesReducer._localStoreSelector;
export const letterTemplatesSelector = createSelector(
    localStoreSelector,
    (state) => state._modelData as LetterTemplate[]
);
export const allLetterTemplatesSelector = createSelector(
    localStoreSelector,
    (state) => state.all
);
