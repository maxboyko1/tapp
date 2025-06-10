import React from "react";
import { Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

import { ConnectedApplicantsList } from "./editable-applicants-list";
import { ConnectedAddApplicantDialog } from "./add-applicant-dialog";
import {
    ConnectedImportInstructorAction,
    ConnectedExportApplicantsAction,
} from "./import-export";
import {
    ActionsList,
    ActionButton,
    ActionHeader,
} from "../../../components/action-buttons";
import { ContentArea } from "../../../components/layout";

export default function AdminApplicantsView() {
    const [addDialogVisible, setAddDialogVisible] = React.useState(false);
    const [inDeleteMode, setInDeleteMode] = React.useState(false);
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
                    Add Applicant
                </ActionButton>
                <ActionButton
                    icon={<DeleteIcon />}
                    onClick={() => setInDeleteMode(!inDeleteMode)}
                    active={inDeleteMode}
                >
                    Delete Applicant
                </ActionButton>

                <ActionHeader>Import/Export</ActionHeader>
                <ConnectedImportInstructorAction />
                <ConnectedExportApplicantsAction />
            </ActionsList>
            <ContentArea>
                <ConnectedAddApplicantDialog
                    show={addDialogVisible}
                    onHide={() => {
                        setAddDialogVisible(false);
                    }}
                />
                <Typography variant="h3" sx={{ mb: 2 }}>
                    Applicants
                </Typography>
                <ConnectedApplicantsList inDeleteMode={inDeleteMode} />
            </ContentArea>
        </div>
    );
}
