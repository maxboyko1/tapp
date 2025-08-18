import React from "react";
import { useSelector } from "react-redux";
import { CircularProgress, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import TrashIcon from "@mui/icons-material/Delete";

import { ConnectedOfferTable } from "../offertable";
import { ConnectedAddAssignmentDialog } from "./add-assignment-dialog";
import { ConnectedViewAssignmentDetailsAction } from "./assignment-details";
import { ConnectedOfferActionButtons } from "./offer-actions";
import { DownloadOfferPdfs } from "./download-offers";
import {
    ConnectedExportAssignmentsAction,
    ConnectedImportAssignmentsAction,
} from "./import-export";
import {
    ActionsList,
    ActionButton,
    ActionHeader,
} from "../../../components/action-buttons";
import { ContentArea } from "../../../components/layout";
import { MissingActiveSessionWarning } from "../../../components/sessions";
import {
    activeSessionSelector,
    assignmentsSelector,
} from "../../../api/actions";
import { offerTableSelector } from "../offertable/actions";
import { Assignment } from "../../../api/defs/types";

export default function AdminAssignmentsView() {
    const [addDialogVisible, setAddDialogVisible] = React.useState(false);
    const activeSession = useSelector(activeSessionSelector);
    // While data is being imported, updating the react table takes a long time,
    // so we use this variable to hide the react table during import.
    const [inProgress, setInProgress] = React.useState(false);
    const [inDeleteMode, setInDeleteMode] = React.useState(false);
    const { selectedAssignmentIds } = useSelector(offerTableSelector);

    const assignments = useSelector(assignmentsSelector);
    const assignmentsById = React.useMemo(() => {
        const ret: Record<number, Assignment> = {};
        for (const assignment of assignments) {
            ret[assignment.id] = assignment;
        }
        return ret;
    }, [assignments]);
    const selectedAssignments = React.useMemo(
        () => selectedAssignmentIds.map((id) => assignmentsById[id]),
        [selectedAssignmentIds, assignmentsById]
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
                    Add Assignment
                </ActionButton>
                <ActionButton
                    icon={<TrashIcon />}
                    onClick={() => setInDeleteMode(!inDeleteMode)}
                    active={inDeleteMode}
                    disabled={!activeSession}
                >
                    Delete Assignment
                </ActionButton>
                <DownloadOfferPdfs selectedAssignments={selectedAssignments} />
                <ActionHeader>Import/Export</ActionHeader>
                <ConnectedImportAssignmentsAction
                    disabled={!activeSession}
                    setImportInProgress={setInProgress}
                />
                <ConnectedExportAssignmentsAction
                    disabled={!activeSession}
                    setExportInProgress={setInProgress}
                />
                <ActionHeader>Selected Assignment Actions</ActionHeader>
                <ConnectedViewAssignmentDetailsAction />
                <ConnectedOfferActionButtons
                    selectedAssignments={selectedAssignments}
                />
            </ActionsList>
            <ContentArea>
                {activeSession ? null : (
                    <MissingActiveSessionWarning extraText="To view or modify assignments, you must select a session." />
                )}
                <Typography variant="h3" sx={{ mb: 2 }}>
                    Assignments
                </Typography>
                {inProgress ? (
                    <React.Fragment>
                        <CircularProgress size={20} sx={{ mr: 2 }} />
                        In Progress
                    </React.Fragment>
                ) : (
                    <ConnectedOfferTable inDeleteMode={inDeleteMode} />
                )}
                <ConnectedAddAssignmentDialog
                    show={addDialogVisible}
                    onHide={() => {
                        setAddDialogVisible(false);
                    }}
                />
            </ContentArea>
        </div>
    );
}
