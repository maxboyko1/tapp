import { RootState } from "../../../rootReducer";
import { SET_SELECTED_GUARANTEE_ROWS } from "./constants";

// actions
export const setSelectedRows = (data: number[]) => ({
    type: SET_SELECTED_GUARANTEE_ROWS,
    payload: data,
});

// selectors
export const guaranteeTableSelector = (state: RootState) =>
    state.ui.guaranteeTable;
