import React from "react";
import { Alert, Snackbar } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";

import { RootState } from "../../../rootReducer";
import { removeNotification } from "../../../api/reducers/notifications";

/**
 * Notifications popup whenever they show up in state.ui.notifications
 */
export function ConnectedNotifications() {
    const notifications = useSelector(
        (state: RootState) => state.ui.notifications
    );
    const dispatch = useDispatch();
    const [open, setOpen] = React.useState(false);
    const [current, setCurrent] = React.useState(notifications[0] || null);

    React.useEffect(() => {
        if (notifications.length > 0) {
            setCurrent(notifications[0]);
            setOpen(true);
        }
    }, [notifications]);

    const handleClose = (_event: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === "clickaway") return;
        setOpen(false);
        if (current) {
            dispatch(removeNotification(current.id));
        }
    };

    return current ? (
        <Snackbar
            open={open}
            autoHideDuration={6000}
            onClose={handleClose}
            anchorOrigin={{ vertical: "top", horizontal: "right" }}
        >
            <Alert
                onClose={handleClose}
                severity={current.type as any}
                sx={{ width: "100%" }}
                elevation={6}
                variant="filled"
            >
                {current.message}
            </Alert>
        </Snackbar>
    ) : null;
}
