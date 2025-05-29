import React from "react";
import { Typography } from "@mui/material"; 
import AddIcon from "@mui/icons-material/Add";

import { ConnectedAddContractTemplateDialog } from "./contract-template-dialog";
import { ConnectedContractTemplateList } from "./contract-template-list";
import {
    ActionsList,
    ActionButton,
    ActionHeader,
} from "../../../components/action-buttons";
import { ContentArea } from "../../../components/layout";
import { ConnectedUploadContractTemplateAction } from "./upload-contract-template-button";
import { useSelector } from "react-redux";
import { activeSessionSelector } from "../../../api/actions";
import { MissingActiveSessionWarning } from "../../../components/sessions";

export function AdminContractTemplatesView() {
    const [addDialogVisible, setAddDialogVisible] = React.useState(false);
    const activeSession = useSelector(activeSessionSelector);
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
                    Add Contract Template
                </ActionButton>
                <ConnectedUploadContractTemplateAction
                    disabled={!activeSession}
                />
            </ActionsList>
            <ContentArea>
                {activeSession ? null : (
                    <MissingActiveSessionWarning extraText="To view or modify contract templates, you must select a session." />
                )}
                <Typography variant="h3" sx={{ mb: 2 }}>
                    Contract Templates
                </Typography>
                <ConnectedContractTemplateList />
                <ConnectedAddContractTemplateDialog
                    show={addDialogVisible}
                    onHide={() => {
                        setAddDialogVisible(false);
                    }}
                />
            </ContentArea>
        </div>
    );
}

export default AdminContractTemplatesView;