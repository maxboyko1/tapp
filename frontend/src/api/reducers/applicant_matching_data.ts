import {
    FETCH_APPLICANT_MATCHING_DATA_SUCCESS,
    FETCH_ONE_APPLICANT_MATCHING_DATUM_SUCCESS,
    UPSERT_ONE_APPLICANT_MATCHING_DATUM_SUCCESS,
    DELETE_ONE_APPLICANT_MATCHING_DATUM_SUCCESS,
} from "../constants";
import { RawApplicantMatchingDatum } from "../defs/types";
import { createReducer, HasPayload } from "./utils";

interface ApplicantMatchingDataState {
    _modelData: RawApplicantMatchingDatum[];
}
const initialState: ApplicantMatchingDataState = {
    _modelData: [],
};

function upsertItem(
    modelData: RawApplicantMatchingDatum[],
    newItem: RawApplicantMatchingDatum
): RawApplicantMatchingDatum[] {
    let didUpdate = false;
    const newModelData = modelData.map((item) => {
        if (
            item.session_id === newItem.session_id &&
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
export const applicantMatchingDataReducer = createReducer(initialState, {
    [FETCH_APPLICANT_MATCHING_DATA_SUCCESS]: (
        state: ApplicantMatchingDataState,
        action: HasPayload<RawApplicantMatchingDatum[]>
    ) => ({
        ...state,
        _modelData: action.payload,
    }),
    [FETCH_ONE_APPLICANT_MATCHING_DATUM_SUCCESS]: (
        state: ApplicantMatchingDataState,
        action: HasPayload<RawApplicantMatchingDatum>
    ) => ({
        ...state,
        _modelData: upsertItem(state._modelData, action.payload),
    }),
    [UPSERT_ONE_APPLICANT_MATCHING_DATUM_SUCCESS]: (
        state: ApplicantMatchingDataState,
        action: HasPayload<RawApplicantMatchingDatum>
    ) => ({
        ...state,
        _modelData: upsertItem(state._modelData, action.payload),
    }),
    [DELETE_ONE_APPLICANT_MATCHING_DATUM_SUCCESS]: (
        state: ApplicantMatchingDataState,
        action: HasPayload<RawApplicantMatchingDatum>
    ) => {
        const deletedItem = action.payload;
        return {
            ...state,
            _modelData: state._modelData.filter(
                (item) =>
                    !(
                        item.session_id === deletedItem.session_id &&
                        item.applicant_id === deletedItem.applicant_id
                    )
            ),
        };
    },
});
