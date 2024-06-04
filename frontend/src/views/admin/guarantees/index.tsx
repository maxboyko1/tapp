import React from "react";

import {
    ActionsList,
    ActionButton,
    ActionHeader,
} from "../../../components/action-buttons";
import { ContentArea } from "../../../components/layout";
import { FaEdit, FaPlus } from "react-icons/fa";
import { MissingActiveSessionWarning } from "../../../components/sessions";
import { useSelector } from "react-redux";
import {
    activeSessionSelector,
    applicantMatchingDataSelector,
    letterTemplatesSelector,
} from "../../../api/actions";
import { Spinner } from "react-bootstrap";
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
import { ConnectedEditAppointmentDialog } from "./edit-appointment-dialog"
import { DownloadConfirmationPdfs } from "./download-confirmations";
import { guaranteeTableSelector } from "./actions";
import { ApplicantMatchingDatum } from "../../../api/defs/types";

export function AdminAppointmentsView() {
    const [addDialogVisible, setAddDialogVisible] = React.useState(false);
    const [addLetterDialogVisible, setAddLetterDialogVisible] = React.useState(false);
    const [editDialogVisible, setEditDialogVisible] = React.useState(false);
    const activeSession = useSelector(activeSessionSelector);
    const letterTemplates = useSelector(letterTemplatesSelector);
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
                    icon={<FaPlus />}
                    onClick={() => {
                        setAddDialogVisible(true);
                    }}
                    disabled={!activeSession}
                >
                    Add Appointment
                </ActionButton>
                <ActionButton 
                    icon={<FaPlus />}
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

                <ActionButton
                    disabled={!(selectedApplicantMatchingData.length === 1)}
                    title={
                        selectedApplicantMatchingData.length === 1
                            ? "Edit the selected appointment"
                            : "Please select a single appointment to edit (you cannot edit multiple appointments at the same time)"
                    }
                    onClick={() => setEditDialogVisible(true)}
                    icon={<FaEdit />}
                >
                    Edit Appointment
                </ActionButton>
            </ActionsList>
            <ContentArea>
                {activeSession ? null : (
                    <MissingActiveSessionWarning extraText="To view or modify subsequent appointment guarantees, you must select a session." />
                )}

                {inProgress ? (
                    <React.Fragment>
                        <Spinner animation="border" className="mr-2" />
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
                <ConnectedEditAppointmentDialog
                    show={editDialogVisible}
                    onHide={() => {
                        setEditDialogVisible(false);
                    }}
                    applicantMatchingDatum={selectedApplicantMatchingData[0]}
                    letterTemplates={letterTemplates}
                />
            </ContentArea>
        </div>
    );
}
