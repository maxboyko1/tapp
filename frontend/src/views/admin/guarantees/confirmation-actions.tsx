import React from "react";
import {
    confirmationForApplicantMatchingDatumCreate,
    confirmationForApplicantMatchingDatumEmail,
    confirmationForApplicantMatchingDatumNag,
    confirmationForApplicantMatchingDatumWithdraw,
    setConfirmationForApplicantMatchingDatumAccepted,
    setConfirmationForApplicantMatchingDatumRejected,
} from "../../../api/actions";
import {
    CreateConfirmationButtonWithDialog,
    WithdrawConfirmationButtonWithDialog,
    EmailConfirmationButtonWithDialog,
    NagConfirmationButtonWithDialog,
    AcceptConfirmationButtonWithDialog,
    RejectConfirmationButtonWithDialog,
} from "./confirmation-button-with-dialog";
import { ApplicantMatchingDatum } from "../../../api/defs/types";
import { useThunkDispatch } from "../../../libs/thunk-dispatch";

/**
 * Functions to test what actions you can do with a particular appointment
 */
const ConfirmationTest = {
    canCreate(applicantMatchingDatum: ApplicantMatchingDatum) {
        return (
            applicantMatchingDatum.active_confirmation_status == null ||
            applicantMatchingDatum.active_confirmation_status === "withdrawn"
        );
    },
    canEmail(applicantMatchingDatum: ApplicantMatchingDatum) {
        return (
            applicantMatchingDatum.active_confirmation_status != null &&
            applicantMatchingDatum.active_confirmation_status !== "withdrawn" &&
            applicantMatchingDatum.active_confirmation_status !== "rejected"
        );
    },
    canNag(applicantMatchingDatum: ApplicantMatchingDatum) {
        return applicantMatchingDatum.active_confirmation_status === "pending";
    },
    canWithdraw(applicantMatchingDatum: ApplicantMatchingDatum) {
        return applicantMatchingDatum.active_confirmation_status != null;
    },
    canAccept(applicantMatchingDatum: ApplicantMatchingDatum) {
        return applicantMatchingDatum.active_confirmation_status != null;
    },
    canReject(applicantMatchingDatum: ApplicantMatchingDatum) {
        return applicantMatchingDatum.active_confirmation_status != null;
    },
};

export function ConnectedConfirmationActionButtons({
    selectedApplicantMatchingData,
}: {
    selectedApplicantMatchingData: ApplicantMatchingDatum[];
}) {
    const dispatch = useThunkDispatch();

    function createConfirmations() {
        return Promise.all(
            selectedApplicantMatchingData.map((applicantMatchingDatum: ApplicantMatchingDatum) =>
                dispatch(confirmationForApplicantMatchingDatumCreate(applicantMatchingDatum))
            )
        );
    }

    function withdrawConfirmations() {
        return Promise.all(
            selectedApplicantMatchingData.map((applicantMatchingDatum: ApplicantMatchingDatum) =>
                dispatch(confirmationForApplicantMatchingDatumWithdraw(applicantMatchingDatum))
            )
        );
    }

    function emailConfirmations() {
        return Promise.all(
            selectedApplicantMatchingData.map((applicantMatchingDatum: ApplicantMatchingDatum) =>
                dispatch(confirmationForApplicantMatchingDatumEmail(applicantMatchingDatum))
            )
        );
    }

    function nagConfirmations() {
        return Promise.all(
            selectedApplicantMatchingData.map((applicantMatchingDatum: ApplicantMatchingDatum) =>
                dispatch(confirmationForApplicantMatchingDatumNag(applicantMatchingDatum))
            )
        );
    }

    function acceptConfirmations() {
        return Promise.all(
            selectedApplicantMatchingData.map((applicantMatchingDatum: ApplicantMatchingDatum) =>
                dispatch(setConfirmationForApplicantMatchingDatumAccepted(applicantMatchingDatum))
            )
        );
    }

    function rejectConfirmations() {
        return Promise.all(
            selectedApplicantMatchingData.map((applicantMatchingDatum: ApplicantMatchingDatum) =>
                dispatch(setConfirmationForApplicantMatchingDatumRejected(applicantMatchingDatum))
            )
        );
    }

    const actionPermitted: Partial<Record<keyof typeof ConfirmationTest, boolean>> =
        {};
    for (const key of Object.keys(ConfirmationTest) as (keyof typeof ConfirmationTest)[]) {
        actionPermitted[key] =
            selectedApplicantMatchingData.length !== 0 &&
            selectedApplicantMatchingData.every(ConfirmationTest[key]);
    }

    return (
        <React.Fragment>
            <CreateConfirmationButtonWithDialog
                disabled={!actionPermitted.canCreate}
                selectedApplicantMatchingData={selectedApplicantMatchingData}
                callback={createConfirmations}
            />
            <WithdrawConfirmationButtonWithDialog
                disabled={!actionPermitted.canWithdraw}
                selectedApplicantMatchingData={selectedApplicantMatchingData}
                callback={withdrawConfirmations}
            />
            <EmailConfirmationButtonWithDialog
                disabled={!actionPermitted.canEmail}
                selectedApplicantMatchingData={selectedApplicantMatchingData}
                callback={emailConfirmations}
            />
            <NagConfirmationButtonWithDialog
                disabled={!actionPermitted.canNag}
                selectedApplicantMatchingData={selectedApplicantMatchingData}
                callback={nagConfirmations}
            />
            <AcceptConfirmationButtonWithDialog
                disabled={!actionPermitted.canAccept}
                selectedApplicantMatchingData={selectedApplicantMatchingData}
                callback={acceptConfirmations}
            />
            <RejectConfirmationButtonWithDialog
                disabled={!actionPermitted.canReject}
                selectedApplicantMatchingData={selectedApplicantMatchingData}
                callback={rejectConfirmations}
            />
        </React.Fragment>
    );
}
