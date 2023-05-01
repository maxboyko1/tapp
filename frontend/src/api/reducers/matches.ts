import {
    FETCH_MATCHES_SUCCESS,
    FETCH_ONE_MATCH_SUCCESS,
    UPSERT_ONE_MATCH_SUCCESS,
    DELETE_ONE_MATCH_SUCCESS,
} from "../constants";
import { RawMatch } from "../defs/types";
import { createReducer, HasPayload } from "./utils";

interface MatchState {
    _modelData: RawMatch[];
}
const initialState: MatchState = {
    _modelData: [],
};

function upsertItem(modelData: RawMatch[], newItem: RawMatch): RawMatch[] {
    let didUpdate = false;
    const newModelData = modelData.map((item) => {
        if (
            item.position_id === newItem.position_id &&
            item.applicant_id === newItem.applicant_id
        ) {
            didUpdate = true;
            return newItem;
        }
        return item;
    });
    if (!didUpdate) {
        newModelData.push(newItem);
    }
    return newModelData;
}

// ApplicantMatchingDatum have no `id` field, but they are uniquely determined
// by their `session_id` and `applicant_id`. So, we need to create custom
// reducer functions.
export const matchesReducer = createReducer(initialState, {
    [FETCH_MATCHES_SUCCESS]: (
        state: MatchState,
        action: HasPayload<RawMatch[]>
    ) => ({
        ...state,
        _modelData: action.payload,
    }),
    [FETCH_ONE_MATCH_SUCCESS]: (
        state: MatchState,
        action: HasPayload<RawMatch>
    ) => ({
        ...state,
        _modelData: upsertItem(state._modelData, action.payload),
    }),
    [UPSERT_ONE_MATCH_SUCCESS]: (
        state: MatchState,
        action: HasPayload<RawMatch>
    ) => ({
        ...state,
        _modelData: upsertItem(state._modelData, action.payload),
    }),
    [DELETE_ONE_MATCH_SUCCESS]: (
        state: MatchState,
        action: HasPayload<RawMatch>
    ) => {
        const deletedItem = action.payload;
        return {
            ...state,
            _modelData: state._modelData.filter(
                (item) =>
                    !(
                        item.position_id === deletedItem.position_id &&
                        item.applicant_id === deletedItem.applicant_id
                    )
            ),
        };
    },
});
