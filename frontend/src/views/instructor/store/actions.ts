import { createSelector } from "reselect";
import { positionsSelector } from "../../../api/actions";
import { RootState } from "../../../rootReducer";
import { SET_INSTRUCTOR_ACTIVE_POSITION } from "./constants";

// actions
export const setActivePositionId = (data: number | null) => ({
    type: SET_INSTRUCTOR_ACTIVE_POSITION,
    payload: data,
});

// selectors
export const instructorUISelector = (state: RootState) => state.ui.instructor;
export const activePositionSelector = createSelector(
    [instructorUISelector, positionsSelector],
    (instructorUI, positions) => {
        return (
            positions.find(
                (position) => position.id === instructorUI.activePositionId
            ) || null
        );
    }
);
