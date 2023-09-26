import React from "react";

import {
    ActionsList,
    ActionButton,
    ActionHeader,
} from "../../../components/action-buttons";
import { ContentArea } from "../../../components/layout";
import { FaPlus } from "react-icons/fa";
import { MissingActiveSessionWarning } from "../../../components/sessions";
import { useSelector } from "react-redux";
import { activeSessionSelector } from "../../../api/actions";
import { Spinner } from "react-bootstrap";
import { ConnectedGuaranteeTable } from "./guarantee-table";

import { ConnectedAddAppointmentDialog } from "./add-guarantee-dialog";
import {
    ConnectedExportAppointmentsAction,
    ConnectedImportAppointmentsAction,
} from "./import-export";

export function AdminAppointmentsView() {
    const [addDialogVisible, setAddDialogVisible] = React.useState(false);
    const activeSession = useSelector(activeSessionSelector);
    // While data is being imported, updating the react table takes a long time,
    // so we use this variable to hide the react table during import.
    const [inProgress] = React.useState(false);

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
                <ActionHeader>Import/Export</ActionHeader>
                <ConnectedImportAppointmentsAction />
                <ConnectedExportAppointmentsAction />
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
            </ContentArea>
        </div>
    );
}
