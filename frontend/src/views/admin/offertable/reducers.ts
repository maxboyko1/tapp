import { createReducer } from "redux-create-reducer";
import { SET_SELECTED_ROWS } from "./constants";

interface OfferTableState {
    selectedAssignmentIds: number[];
}

// initialize the state of offer table
const initialState: OfferTableState = {
    selectedAssignmentIds: [],
};

const offerTableReducer = createReducer(initialState, {
    [SET_SELECTED_ROWS]: (state, action) => {
        return { ...state, selectedAssignmentIds: action.payload };
    },
});

export { offerTableReducer };