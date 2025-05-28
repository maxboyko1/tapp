import React from "react";
import { connect } from "react-redux";
import { 
    Alert,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Typography,
} from "@mui/material";

import { strip } from "../../../libs/utils";
import { SessionEditor } from "../../../components/forms/session-editor";
import { upsertSession, sessionsSelector } from "../../../api/actions";

function getConflicts(session, sessions = []) {
    const ret = { delayShow: "", immediateShow: "" };
    if (
        !strip(session.name) ||
        !strip(session.start_date) ||
        !strip(session.end_date)
    ) {
        ret.delayShow = "A first name, start date, and end date is required";
    }
    const matchingSession = sessions.find(
        (x) => strip(x.name) === strip(session.name)
    );
    if (matchingSession) {
        ret.immediateShow = (
            <p>Another session exists with name={session.name}</p>
        );
    }
    return ret;
}

const BLANK_SESSION = {
    name: "",
    start_date: "",
    end_date: "",
    rate1: "",
    rate2: "",
};

export function AddSessionDialog(props) {
    const { show, onHide = () => {}, sessions, upsertSession } = props;
    const [newSession, setNewSession] = React.useState(BLANK_SESSION);

    React.useEffect(() => {
        if (!show) {
            // If the dialog is hidden, reset the state
            setNewSession(BLANK_SESSION);
        }
    }, [show]);

    function createInstructor() {
        upsertSession(newSession);
        onHide();
    }

    const conflicts = getConflicts(newSession, sessions);

    return (
        <Dialog open={show} onClose={onHide} maxWidth="sm" fullWidth>
            <DialogTitle>
                <Typography variant="h6">
                    Add Session
                </Typography>
            </DialogTitle>
            <DialogContent dividers>
                <SessionEditor
                    session={newSession}
                    setSession={setNewSession}
                />
                {conflicts.immediateShow ? (
                    <Alert severity="error">{conflicts.immediateShow}</Alert>
                ) : null}
            </DialogContent>
            <DialogActions>
                <Button onClick={onHide} variant="contained" color="secondary">
                    Cancel
                </Button>
                <Button
                    onClick={createInstructor}
                    title={conflicts.delayShow || "Create Session"}
                    disabled={
                        !!conflicts.delayShow || !!conflicts.immediateShow
                    }
                    variant="contained"
                    color="primary"
                >
                    Create Session
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export const ConnectedAddSessionDialog = connect(
    (state) => ({ sessions: sessionsSelector(state) }),
    { upsertSession }
)(AddSessionDialog);
