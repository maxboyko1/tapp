import React from "react";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import BlockIcon from "@mui/icons-material/Block";
import CheckIcon from "@mui/icons-material/Check";
import EmailIcon from "@mui/icons-material/Email";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import PersonRemoveIcon from "@mui/icons-material/PersonRemove";

import { ActionButton } from "../../../components/action-buttons";
import { GuaranteeConfirmDialog } from "./guarantee-confirm-dialog";
import { ApplicantMatchingDatum } from "../../../api/defs/types";

type ButtonWithDialogProps = {
    disabled?: boolean;
    selectedApplicantMatchingData: ApplicantMatchingDatum[];
    callback: Function;
};

export function CreateConfirmationButtonWithDialog({
    disabled = false,
    selectedApplicantMatchingData,
    callback,
}: ButtonWithDialogProps) {
    const [showConfirm, setShowConfirm] = React.useState(false);

    function confirmAppointmentConfirmationCreate() {
        if (selectedApplicantMatchingData?.length > 1) {
            setShowConfirm(true);
        } else {
            callback();
        }
    }

    return (
        <React.Fragment>
            <ActionButton
                icon={<PersonAddIcon />}
                onClick={confirmAppointmentConfirmationCreate}
                disabled={disabled}
            >
                Create Confirmation
            </ActionButton>
            <GuaranteeConfirmDialog
                data={selectedApplicantMatchingData}
                visible={showConfirm}
                setVisible={setShowConfirm}
                callback={callback}
                title="Creating Multiple Appointment Confirmations"
                body={`You are creating the following ${selectedApplicantMatchingData.length} appointment confirmations.`}
                confirm={`Create ${selectedApplicantMatchingData.length} Appointment Confirmations`}
            />
        </React.Fragment>
    );
}

export function WithdrawConfirmationButtonWithDialog({
    disabled = false,
    selectedApplicantMatchingData,
    callback,
}: ButtonWithDialogProps) {
    const [showConfirm, setShowConfirm] = React.useState(false);

    function confirmAppointmentConfirmationWithdraw() {
        if (selectedApplicantMatchingData?.length > 1) {
            setShowConfirm(true);
        } else {
            callback();
        }
    }

    return (
        <React.Fragment>
            <ActionButton
                icon={<PersonRemoveIcon />}
                onClick={confirmAppointmentConfirmationWithdraw}
                disabled={disabled}
            >
                Withdraw Confirmation
            </ActionButton>
            <GuaranteeConfirmDialog
                data={selectedApplicantMatchingData}
                visible={showConfirm}
                setVisible={setShowConfirm}
                callback={callback}
                title="Withdrawing Multiple Appointment Confirmations"
                body={`You are withdrawing the following ${selectedApplicantMatchingData.length} appointment confirmations.`}
                confirm={`Withdraw ${selectedApplicantMatchingData.length} Appointment Confirmations`}
            />
        </React.Fragment>
    );
}

export function EmailConfirmationButtonWithDialog({
    disabled = false,
    selectedApplicantMatchingData,
    callback,
}: ButtonWithDialogProps) {
    const [showConfirm, setShowConfirm] = React.useState(false);

    function confirmAppointmentConfirmationEmail() {
        if (selectedApplicantMatchingData?.length > 1) {
            setShowConfirm(true);
        } else {
            callback();
        }
    }

    return (
        <React.Fragment>
            <ActionButton
                icon={<EmailIcon />}
                onClick={confirmAppointmentConfirmationEmail}
                disabled={disabled}
            >
                Email Confirmation
            </ActionButton>
            <GuaranteeConfirmDialog
                data={selectedApplicantMatchingData}
                visible={showConfirm}
                setVisible={setShowConfirm}
                callback={callback}
                title="Emailing Multiple Appointment Confirmations"
                body={`You are emailing the following ${selectedApplicantMatchingData.length} appointment confirmations.`}
                confirm={`Email ${selectedApplicantMatchingData.length} Appointment Confirmations`}
            />
        </React.Fragment>
    );
}

export function NagConfirmationButtonWithDialog({
    disabled = false,
    selectedApplicantMatchingData,
    callback,
}: ButtonWithDialogProps) {
    const [showConfirm, setShowConfirm] = React.useState(false);

    function confirmAppointmentConfirmationNag() {
        if (selectedApplicantMatchingData?.length > 1) {
            setShowConfirm(true);
        } else {
            callback();
        }
    }

    return (
        <React.Fragment>
            <ActionButton
                icon={<AccessTimeIcon />}
                onClick={confirmAppointmentConfirmationNag}
                disabled={disabled}
            >
                Nag Confirmation
            </ActionButton>
            <GuaranteeConfirmDialog
                data={selectedApplicantMatchingData}
                visible={showConfirm}
                setVisible={setShowConfirm}
                callback={callback}
                title="Nagging Multiple Appointment Confirmations"
                body={`You are nagging the following ${selectedApplicantMatchingData.length} appointment confirmations.`}
                confirm={`Nag ${selectedApplicantMatchingData.length} Appointment Confirmations`}
            />
        </React.Fragment>
    );
}

export function AcceptConfirmationButtonWithDialog({
    disabled = false,
    selectedApplicantMatchingData,
    callback,
}: ButtonWithDialogProps) {
    const [showConfirm, setShowConfirm] = React.useState(false);

    function confirmAppointmentConfirmationAccept() {
        if (selectedApplicantMatchingData?.length > 1) {
            setShowConfirm(true);
        } else {
            callback();
        }
    }

    return (
        <React.Fragment>
            <ActionButton
                icon={<CheckIcon />}
                onClick={confirmAppointmentConfirmationAccept}
                disabled={disabled}
            >
                Set as Accepted
            </ActionButton>
            <GuaranteeConfirmDialog
                data={selectedApplicantMatchingData}
                visible={showConfirm}
                setVisible={setShowConfirm}
                callback={callback}
                title="Accepting Multiple Appointment Confirmations"
                body={`You are accepting the following ${selectedApplicantMatchingData.length} appointment confirmations.`}
                confirm={`Accept ${selectedApplicantMatchingData.length} Appointment Confirmations`}
            />
        </React.Fragment>
    );
}

export function RejectConfirmationButtonWithDialog({
    disabled = false,
    selectedApplicantMatchingData,
    callback,
}: ButtonWithDialogProps) {
    const [showConfirm, setShowConfirm] = React.useState(false);

    function confirmAppointmentConfirmationReject() {
        if (selectedApplicantMatchingData?.length > 1) {
            setShowConfirm(true);
        } else {
            callback();
        }
    }

    return (
        <React.Fragment>
            <ActionButton
                icon={<BlockIcon />}
                onClick={confirmAppointmentConfirmationReject}
                disabled={disabled}
            >
                Set as Rejected
            </ActionButton>
            <GuaranteeConfirmDialog
                data={selectedApplicantMatchingData}
                visible={showConfirm}
                setVisible={setShowConfirm}
                callback={callback}
                title="Rejecting Multiple Appointment Confirmations"
                body={`You are rejecting the following ${selectedApplicantMatchingData.length} appointment confirmations.`}
                confirm={`Reject ${selectedApplicantMatchingData.length} Appointment Confirmations`}
            />
        </React.Fragment>
    );
}
