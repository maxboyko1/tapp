import {
    FETCH_LETTER_TEMPLATES_SUCCESS,
    FETCH_ONE_LETTER_TEMPLATE_SUCCESS,
    UPSERT_ONE_LETTER_TEMPLATE_SUCCESS,
    DELETE_ONE_LETTER_TEMPLATE_SUCCESS,
    FETCH_ALL_LETTER_TEMPLATES_SUCCESS,
} from "../constants";
import { RawLetterTemplate } from "../defs/types";
import { createBasicReducerObject, createReducer, HasPayload } from "./utils";

interface LetterTemplateState {
    _modelData: RawLetterTemplate[];
    all: { template_file: string }[];
}

const initialState: LetterTemplateState = {
    _modelData: [],
    all: [],
};

// basicReducers is an object whose keys are FETCH_*_SUCCESS, etc,
// and values are the corresponding reducer functions
const basicReducers = createBasicReducerObject<RawLetterTemplate>(
    FETCH_LETTER_TEMPLATES_SUCCESS,
    FETCH_ONE_LETTER_TEMPLATE_SUCCESS,
    UPSERT_ONE_LETTER_TEMPLATE_SUCCESS,
    DELETE_ONE_LETTER_TEMPLATE_SUCCESS
);

export const letterTemplatesReducer = createReducer(initialState, {
    ...basicReducers,
    [FETCH_ALL_LETTER_TEMPLATES_SUCCESS]: (
        state,
        action: HasPayload<{ template_file: string }[]>
    ) => ({
        ...state,
        all: action.payload,
    }),
});
