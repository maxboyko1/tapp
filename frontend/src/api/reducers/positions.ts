import {
    FETCH_POSITIONS_SUCCESS,
    FETCH_ONE_POSITION_SUCCESS,
    UPSERT_ONE_POSITION_SUCCESS,
    DELETE_ONE_POSITION_SUCCESS,
    FETCH_ALL_POSITIONS_SUCCESS,
} from "../constants";
import { RawPosition } from "../defs/types";
import { createAdvancedReducerObject, createReducer } from "./utils";

interface PositionState {
    _modelData: RawPosition[];
    _allData: RawPosition[];
}
const initialState: PositionState = {
    _modelData: [],
    _allData: [],
};

// basicReducers is an object whose keys are FETCH_SESSIONS_SUCCESS, etc,
// and values are the corresponding reducer functions
const reducers = createAdvancedReducerObject<RawPosition>(
    FETCH_ALL_POSITIONS_SUCCESS,
    FETCH_POSITIONS_SUCCESS,
    FETCH_ONE_POSITION_SUCCESS,
    UPSERT_ONE_POSITION_SUCCESS,
    DELETE_ONE_POSITION_SUCCESS
);

export const positionsReducer = createReducer(initialState, reducers);
