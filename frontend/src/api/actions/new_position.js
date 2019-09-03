import { error } from "react-notification-system-redux";
import { errorProps } from "../../modules/notifications/constants";
import {
    CREATE_NEW_POSITION_SUCCESS,
    IMPORT_NEW_POSITION_SUCCESS
} from "../constants/new_position";
import { apiPOST } from "../../libs/apiUtils";



export const createNewPosition = payload => async dispatch => {
    try {
        const data = await apiPOST("/positions", payload);
        dispatch(createNewPositionSuccess(data));
        window.location = "/tapp/positions";
    } catch (e) {
        dispatch(error({ ...errorProps, message: e.toString() }));
    }
};

//used for uploading csv files
export const importNewPosition = payload => async dispatch => {
    try {
        const data = await apiPOST("/positions/import", payload);
        dispatch(importNewPositionSuccess(data));
    } catch (e) {
        dispatch(
            error({
                ...errorProps,
                message: e.toString()
            })
        );
    }
};

export const importNewPositionSuccess = payload => ({
    type: IMPORT_NEW_POSITION_SUCCESS,
    payload
});
export const createNewPositionSuccess = payload => ({
    type: CREATE_NEW_POSITION_SUCCESS,
    payload
});