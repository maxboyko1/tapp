import React from "react";
import { useSelector } from "react-redux";
import { Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import TrashIcon from "@mui/icons-material/Delete";

import { ConnectedAddPositionDialog } from "./add-position-dialog";
import { ConnectedPositionsList } from "./position-list";
import {
    ConnectedExportPositionsAction,
    ConnectedImportPositionsAction,
} from "./import-export";
import {
    ActionsList,
    ActionButton,
    ActionHeader,
} from "../../../components/action-buttons";
import { ContentArea } from "../../../components/layout";
import { activeSessionSelector, positionsSelector } from "../../../api/actions";
import { Position } from "../../../api/defs/types";
import { positionsTableSelector } from "./actions";
import { MissingActiveSessionWarning } from "../../../components/sessions";
import { ConnectedPositionDetailsDialog } from "./position-details-dialog";
import { EmailPositionsButtonWithDialog } from "./email-button";

export default function AdminPositionsView() {
    const [addDialogVisible, setAddDialogVisible] = React.useState(false);
    const [inDeleteMode, setInDeleteMode] = React.useState(false);
    const activeSession = useSelector(activeSessionSelector);
    // While data is being imported, updating the react table takes a long time,
    // so we use this variable to hide the react table during import.
    const [importInProgress, setImportInProgress] = React.useState(false);

    const { selectedPositionIds } = useSelector(positionsTableSelector);
    const positions = useSelector<any, Position[]>(positionsSelector);
    const selectedPositions = positions.filter((position) =>
        selectedPositionIds.includes(position.id)
    );

    return (
        <div className="page-body">
            <ActionsList>
                <ActionHeader>Available Actions</ActionHeader>
                <ActionButton
                    icon={<AddIcon />}
                    onClick={() => {
                        setAddDialogVisible(true);
                    }}
                    disabled={!activeSession}
                >
                    Add Position
                </ActionButton>
                <ActionButton
                    icon={<TrashIcon />}
                    onClick={() => setInDeleteMode(!inDeleteMode)}
                    active={inDeleteMode}
                    disabled={!activeSession}
                >
                    Delete Position
                </ActionButton>
                <ActionHeader>Import/Export</ActionHeader>
                <ConnectedImportPositionsAction
                    disabled={!activeSession}
                    setImportInProgress={setImportInProgress}
                />
                <ConnectedExportPositionsAction disabled={!activeSession} />
                <ActionHeader>Selected Position Actions</ActionHeader>
                <ConnectedPositionDetailsDialog />
                <EmailPositionsButtonWithDialog
                    selectedPositions={selectedPositions}
                />
            </ActionsList>
            <ContentArea>
                {activeSession ? null : (
                    <MissingActiveSessionWarning extraText="To view or modify positions, you must select a session." />
                )}
                <Typography variant="h3" sx={{ mb: 2 }}>
                    Positions
                </Typography>
                <ConnectedAddPositionDialog
                    show={addDialogVisible}
                    onHide={() => {
                        setAddDialogVisible(false);
                    }}
                />
                {!importInProgress && (
                    <ConnectedPositionsList inDeleteMode={inDeleteMode} />
                )}
            </ContentArea>
        </div>
    );
}

export { ConnectedAddPositionDialog, ConnectedPositionsList };