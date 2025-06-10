import React from "react";
import { useSelector } from "react-redux";
import { Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import TrashIcon from "@mui/icons-material/Delete";

import { ConnectedAddSessionDialog } from "./add-session-dialog";
import { activeSessionSelector } from "../../../api/actions";
import { ConnectedSessionsList } from "../../../components/sessions";
import {
    ActionsList,
    ActionButton,
    ActionHeader,
} from "../../../components/action-buttons";
import { ContentArea } from "../../../components/layout";
import { Session } from "../../../api/defs/types";

export default function AdminSessionsView() {
    const [addDialogVisible, setAddDialogVisible] = React.useState(false);
    const [inDeleteMode, setInDeleteMode] = React.useState(false);

    const activeSession = useSelector(activeSessionSelector) as Session | null;

    let activeSessionInfo = (
        <Typography component="span">
            There is currently{" "}
            <Typography component="span" color="primary" fontWeight="bold">
                no active session
            </Typography>{" "}
            selected. In order to setup contract/letter templates or create positions and offers, you must select an active session.
        </Typography>
    );

    if (activeSession) {
        activeSessionInfo = (
            <Typography component="span">
                The current active session is{" "}
                <Typography component="span" color="primary" fontWeight="bold">
                    {activeSession.name}
                </Typography>
                . When setting up contract/letter templates or creating positions and offers, they will be attached to the{" "}
                <Typography component="span" fontStyle="italic">
                    {activeSession.name}
                </Typography>{" "}
                session.
            </Typography>
        );
    }

    return (
        <div className="page-body">
            <ActionsList>
                <ActionHeader>Available Actions</ActionHeader>
                <ActionButton
                    icon={<AddIcon />}
                    onClick={() => {
                        setAddDialogVisible(true);
                    }}
                >
                    Add Session
                </ActionButton>
                <ActionButton
                    icon={<TrashIcon />}
                    onClick={() => setInDeleteMode(!inDeleteMode)}
                    active={inDeleteMode}
                >
                    Delete Session
                </ActionButton>
            </ActionsList>
            <ContentArea>
                <Typography variant="h3" sx={{ mb: 2 }}>
                    Session Management and Creation
                </Typography>
                <Typography component="p" sx={{ mb: 1 }}>
                    From this page, you can manage an existing session or create a new session.
                </Typography>
                <Typography component="p" sx={{ mb: 2 }}>{activeSessionInfo}</Typography>

                <Typography variant="h5" gutterBottom>
                    Existing Sessions
                </Typography>
                <ConnectedAddSessionDialog
                    show={addDialogVisible}
                    onHide={() => {
                        setAddDialogVisible(false);
                    }}
                />
                <ConnectedSessionsList inDeleteMode={inDeleteMode} />
            </ContentArea>
        </div>
    );
}

export { ConnectedAddSessionDialog };