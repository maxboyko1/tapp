import { addNotification } from "../reducers/notifications";

export const fetchError = (payload: string) => {
    return addNotification({
        id: "fetchError",
        message: `Error fetching data: ${payload}`,
        type: "error",
    });
};

export const upsertError = (payload: string) => {
    return addNotification({
        id: "upsertError",
        message: `Error updating/inserting data: ${payload}`,
        type: "error",
    });
};

export const deleteError = (payload: string) => {
    return addNotification({
        id: "deleteError",
        message: `Error deleting data: ${payload}`,
        type: "error",
    });
};

// General error for when a more specific error
// type is not known
export const apiError = (payload: string) => {
    return addNotification({
        id: "apiError",
        message: `API Error: ${payload}`,
        type: "error",
    });
};
