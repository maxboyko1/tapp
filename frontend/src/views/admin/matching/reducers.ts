import {
    SET_SELECTED_MATCHING_POSITION,
    SET_APPLICANT_VIEW_MODE,
} from "./constants";
import { createReducer } from "redux-create-reducer";
import { ApplicantViewMode } from "./types";

export interface MatchingDataState {
    selectedMatchingPositionId: number | null;
    applicantViewMode: ApplicantViewMode;
}

const initialState: MatchingDataState = {
    selectedMatchingPositionId: null,
    applicantViewMode: "grid",
};

const matchingDataReducer = createReducer(initialState, {
    [SET_SELECTED_MATCHING_POSITION]: (state, action) => {
        return { ...state, selectedMatchingPositionId: action.payload };
    },
    [SET_APPLICANT_VIEW_MODE]: (state, action) => {
        return { ...state, applicantViewMode: action.payload };
    },
});

export { matchingDataReducer };