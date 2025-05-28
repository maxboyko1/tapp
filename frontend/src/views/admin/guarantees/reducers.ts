import { createReducer } from "redux-create-reducer";
import { SET_SELECTED_GUARANTEE_ROWS } from "./constants";

interface GuaranteeTableState {
    selectedApplicantMatchingDatumIds: number[];
}

// initialize the state of offer table
const initialState: GuaranteeTableState = {
    selectedApplicantMatchingDatumIds: [],
};

const guaranteeTableReducer = createReducer(initialState, {
    [SET_SELECTED_GUARANTEE_ROWS]: (state, action) => {
        return { ...state, selectedApplicantMatchingDatumIds: action.payload };
    },
});

export { guaranteeTableReducer };