import React from "react";
import { CircularProgress, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

import {
    ActionsList,
    ActionButton,
    ActionHeader,
} from "../../../components/action-buttons";
import { ContentArea } from "../../../components/layout";
import { MissingActiveSessionWarning } from "../../../components/sessions";
import { useSelector } from "react-redux";
import {
    activeSessionSelector,
    applicantMatchingDataSelector,
} from "../../../api/actions";
import { ConnectedGuaranteeTable } from "./guarantee-table";

import { ConnectedAddAppointmentDialog } from "./add-guarantee-dialog";
import { ConnectedAddLetterTemplateDialog } from "./add-letter-dialog";
import { ConnectedUploadLetterTemplateAction } from "./upload-letter-template-button";
import {
    ConnectedExportAppointmentsAction,
    ConnectedImportAppointmentsAction,
} from "./import-export";
import { ConnectedViewApplicantMatchingDatumDetailsAction } from "./appointment-details";
import { ConnectedConfirmationActionButtons } from "./confirmation-actions";
import { DownloadConfirmationPdfs } from "./download-confirmations";
import { guaranteeTableSelector } from "./actions";
import { ApplicantMatchingDatum } from "../../../api/defs/types";

export default function AdminAppointmentsView() {
    const [addDialogVisible, setAddDialogVisible] = React.useState(false);
    const [addLetterDialogVisible, setAddLetterDialogVisible] = React.useState(false);
    const activeSession = useSelector(activeSessionSelector);
    // While data is being imported, updating the react table takes a long time,
    // so we use this variable to hide the react table during import.
    const [inProgress, setInProgress] = React.useState(false);
    const { selectedApplicantMatchingDatumIds } = useSelector(guaranteeTableSelector);
    const applicantMatchingData = useSelector(applicantMatchingDataSelector);
    const applicantMatchingDataById = React.useMemo(() => {
        const ret: Record<number, ApplicantMatchingDatum> = {};
        for (const applicantMatchingDatum of applicantMatchingData) {
            ret[applicantMatchingDatum.id] = applicantMatchingDatum;
        }
        return ret;
    }, [applicantMatchingData]);
    const selectedApplicantMatchingData = React.useMemo(
        () => selectedApplicantMatchingDatumIds.map((id) => applicantMatchingDataById[id]),
        [selectedApplicantMatchingDatumIds, applicantMatchingDataById]
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
                    Add Appointment
                </ActionButton>
                <ActionButton 
                    icon={<AddIcon />}
                    onClick={() => {
                        setAddLetterDialogVisible(true);
                    }}
                    disabled={!activeSession}
                >
                    Add Letter Template
                </ActionButton>
                <ConnectedUploadLetterTemplateAction
                    disabled={!activeSession}
                />
                <DownloadConfirmationPdfs selectedApplicantMatchingData={selectedApplicantMatchingData}/>
                <ActionHeader>Import/Export</ActionHeader>
                <ConnectedImportAppointmentsAction
                    disabled={!activeSession}
                    setImportInProgress={setInProgress}
                />
                <ConnectedExportAppointmentsAction
                    disabled={!activeSession}
                    setExportInProgress={setInProgress}
                />
                <ActionHeader>Selected Appointment Actions</ActionHeader>
                <ConnectedViewApplicantMatchingDatumDetailsAction />
                <ConnectedConfirmationActionButtons selectedApplicantMatchingData={selectedApplicantMatchingData}/>
            </ActionsList>
            <ContentArea>
                {activeSession ? null : (
                    <MissingActiveSessionWarning extraText="To view or modify subsequent appointment guarantees, you must select a session." />
                )}
                <Typography variant="h3" sx={{ mb: 2 }}>
                    Subsequent Appointments
                </Typography>
                {inProgress ? (
                    <React.Fragment>
                        <CircularProgress size={20} sx={{ mr: 2 }} />
                        In Progress
                    </React.Fragment>
                ) : (
                    <ConnectedGuaranteeTable />
                )}
                <ConnectedAddAppointmentDialog
                    show={addDialogVisible}
                    onHide={() => {
                        setAddDialogVisible(false);
                    }}
                />
                <ConnectedAddLetterTemplateDialog
                    show={addLetterDialogVisible}
                    onHide={() => {
                        setAddLetterDialogVisible(false);
                    }}
                />
            </ContentArea>
        </div>
    );
}
