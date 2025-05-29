import React from "react";
import { Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

import { ConnectedAddDdahDialog } from "./add-ddah-dialog";
import {
    ConnectedImportDdahsAction,
    ConnectedExportDdahsAction,
    ConnectedDownloadPositionDdahTemplatesAction,
    ConnectedDownloadDdahsAcceptedListAction,
} from "./import-export";
import {
    ActionsList,
    ActionButton,
    ActionHeader,
} from "../../../components/action-buttons";
import { ContentArea } from "../../../components/layout";
import { ConnectedDdahsTable } from "../ddah-table";
import { MissingActiveSessionWarning } from "../../../components/sessions";
import { useSelector } from "react-redux";
import { activeSessionSelector } from "../../../api/actions";
import { ddahTableSelector } from "../ddah-table/actions";
import { ddahsSelector } from "../../../api/actions/ddahs";
import { Ddah } from "../../../api/defs/types";
import {
    ApproveDdahsButtonWithDialog,
    DeleteDdahsButtonWithDialog,
    EmailDdahsButtonWithDialog,
} from "./selected-ddah-actions";
import { DownloadDdahs } from "./download-ddahs";

export function AdminDdahsView() {
    const [addDialogVisible, setAddDialogVisible] = React.useState(false);
    // While data is being imported, updating the react table takes a long time,
    // so we use this variable to hide the react table during import.
    const [importInProgress, setImportInProgress] = React.useState(false);
    const activeSession = useSelector(activeSessionSelector);
    const { selectedDdahIds } = useSelector(ddahTableSelector);
    const ddahs = useSelector<any, Ddah[]>(ddahsSelector);
    const selectedDdahs = ddahs.filter((ddah) =>
        selectedDdahIds.includes(ddah.id)
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
                    Add DDAH
                </ActionButton>
                <ConnectedDownloadPositionDdahTemplatesAction
                    disabled={!activeSession}
                />
                <ConnectedDownloadDdahsAcceptedListAction
                    disabled={!activeSession}
                />
                <DownloadDdahs selectedDdahs={selectedDdahs} />

                <ActionHeader>Import/Export</ActionHeader>
                <ConnectedImportDdahsAction
                    disabled={!activeSession}
                    setImportInProgress={setImportInProgress}
                />
                <ConnectedExportDdahsAction disabled={!activeSession} />
                <ActionHeader>Selected DDAH Actions</ActionHeader>
                <EmailDdahsButtonWithDialog selectedDdahs={selectedDdahs} />
                <ApproveDdahsButtonWithDialog selectedDdahs={selectedDdahs} />
                <DeleteDdahsButtonWithDialog selectedDdahs={selectedDdahs} />
            </ActionsList>
            <ContentArea>
                {activeSession ? null : (
                    <MissingActiveSessionWarning extraText="To view or modify DDAHs, you must select a session." />
                )}
                <ConnectedAddDdahDialog
                    show={addDialogVisible}
                    onHide={() => {
                        setAddDialogVisible(false);
                    }}
                />
                <Typography variant="h3" sx={{ mb: 2 }}>
                    DDAHs
                </Typography>
                {!importInProgress && <ConnectedDdahsTable />}
            </ContentArea>
        </div>
    );
}

export default AdminDdahsView;