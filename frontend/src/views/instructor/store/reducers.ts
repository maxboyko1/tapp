import { SET_INSTRUCTOR_ACTIVE_POSITION } from "./constants";
import { createReducer } from "redux-create-reducer";

interface InstructorUIState {
    activePositionId: number | null;
}

// initialize the state of offer table
const initialState: InstructorUIState = {
    activePositionId: null,
};

const instructorUIReducer = createReducer(initialState, {
    [SET_INSTRUCTOR_ACTIVE_POSITION]: (state, action) => {
        return { ...state, activePositionId: action.payload };
    },
});

export { instructorUIReducer };