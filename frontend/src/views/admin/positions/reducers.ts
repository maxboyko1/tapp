import { createReducer } from "redux-create-reducer";
import { SET_SELECTED_POSITIONS } from "./constants";

// Initialize the state of positions table
const initialState = {
    selectedPositionIds: [] as number[],
};

const positionsTableReducer = createReducer(initialState, {
    [SET_SELECTED_POSITIONS]: (state: any, action: any) => {
        return { ...state, selectedPositionIds: action.payload };
    },
});
export type PositionsTableType = typeof initialState;

export { positionsTableReducer };