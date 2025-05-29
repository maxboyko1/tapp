import React from "react";
import { Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import TrashIcon from "@mui/icons-material/Delete";

import { ConnectedInstructorsList } from "./editable-instructors-list";
import { ConnectedAddInstructorDialog } from "./add-instructor-dialog";
import {
    ConnectedImportInstructorAction,
    ConnectedExportInstructorsAction,
} from "./import-export";
import {
    ActionsList,
    ActionButton,
    ActionHeader,
} from "../../../components/action-buttons";
import { ContentArea } from "../../../components/layout";

export function AdminInstructorsView() {
    const [addDialogVisible, setAddDialogVisible] = React.useState(false);
    const [inDeleteMode, setInDeleteMode] = React.useState(false);
    // While data is being imported, updating the react table takes a long time,
    // so we use this variable to hide the react table during import.
    const [importInProgress, setImportInProgress] = React.useState(false);

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
                    Add Instructor
                </ActionButton>
                <ActionButton
                    icon={<TrashIcon />}
                    onClick={() => setInDeleteMode(!inDeleteMode)}
                    active={inDeleteMode}
                >
                    Delete Instructor
                </ActionButton>

                <ActionHeader>Import/Export</ActionHeader>
                <ConnectedImportInstructorAction
                    setImportInProgress={setImportInProgress}
                />
                <ConnectedExportInstructorsAction />
            </ActionsList>
            <ContentArea>
                <Typography variant="h3" sx={{ mb: 2 }}>
                    Instructors
                </Typography>
                <ConnectedAddInstructorDialog
                    show={addDialogVisible}
                    onHide={() => {
                        setAddDialogVisible(false);
                    }}
                />
                {!importInProgress && (
                    <ConnectedInstructorsList inDeleteMode={inDeleteMode} />
                )}
            </ContentArea>
        </div>
    );
}

export { ConnectedInstructorsList, ConnectedAddInstructorDialog };
export default AdminInstructorsView;