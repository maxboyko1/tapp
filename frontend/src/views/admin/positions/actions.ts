import { SET_SELECTED_POSITIONS } from "./constants";
import { PositionsTableType } from "./reducers";

// actions
export const setSelectedRows = (data: number[]) => ({
    type: SET_SELECTED_POSITIONS,
    payload: data,
});

// selectors
export const positionsTableSelector = (state: any) =>
    state.ui.positionsTable as PositionsTableType;
