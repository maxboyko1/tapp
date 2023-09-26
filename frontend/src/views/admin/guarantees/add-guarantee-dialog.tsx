import React from "react";
import { connect } from "react-redux";
import {
    upsertApplicantMatchingDatum,
    applicantsSelector,
    applicantMatchingDataSelector,
    activeSessionSelector,
} from "../../../api/actions";
import { Modal, Button, Alert } from "react-bootstrap";
import { AppointmentEditor } from "../../../components/forms/appointment-editor";
import {
    Applicant,
    ApplicantMatchingDatum,
    Session,
} from "../../../api/defs/types";

function getConflicts(
    applicantMatchingDatum: ApplicantMatchingDatum,
    applicantMatchingData: ApplicantMatchingDatum[] = []
) {
    const ret: { delayShow: string; immediateShow: React.ReactNode } = {
        delayShow: "",
        immediateShow: "",
    };
    if (
        !applicantMatchingDatum.applicant ||
        applicantMatchingDatum.applicant?.id === null ||
        !applicantMatchingDatum.session
    ) {
        ret.delayShow = "An applicant is required";
    }
    const matchingApplicantMatchingDatum = applicantMatchingData.find(
        (x) => x.applicant.id === applicantMatchingDatum.applicant?.id
    );
    if (
        matchingApplicantMatchingDatum &&
        matchingApplicantMatchingDatum.min_hours_owed
    ) {
        ret.immediateShow = (
            <span>
                Appointment guarantee already exists for{" "}
                <b>
                    {matchingApplicantMatchingDatum.applicant.first_name}{" "}
                    {matchingApplicantMatchingDatum.applicant.last_name} (min.
                    hours owed: {matchingApplicantMatchingDatum.min_hours_owed})
                </b>
            </span>
        );
    }
    return ret;
}

const BLANK_APPOINTMENT: Partial<ApplicantMatchingDatum> = {
    min_hours_owed: 0,
    max_hours_owed: null,
    prev_hours_fulfilled: null,
};

export function AddAppointmentDialog(props: {
    show: boolean;
    onHide: (...args: any[]) => any;
    applicantMatchingData: ApplicantMatchingDatum[];
    applicants: Applicant[];
    activeSession: Session | null;
    upsertApplicantMatchingDatum: Function;
}) {
    const {
        show,
        onHide = () => {},
        applicantMatchingData,
        applicants,
        activeSession,
        upsertApplicantMatchingDatum,
    } = props;
    const [newApplicantMatchingDatum, setNewApplicantMatchingDatum] =
        React.useState(BLANK_APPOINTMENT);

    React.useEffect(() => {
        if (!show) {
            // If the dialog is hidden, reset the state
            setNewApplicantMatchingDatum({
                ...BLANK_APPOINTMENT,
                session: activeSession || undefined,
            });
        }
    }, [show, activeSession]);

    function createAppointment() {
        if (newApplicantMatchingDatum) {
            const existingAppointment =
                applicantMatchingData.find((applicantMatchingDatum) => {
                    return (
                        applicantMatchingDatum.applicant.id ===
                            newApplicantMatchingDatum.applicant?.id &&
                        applicantMatchingDatum.session.id ===
                            newApplicantMatchingDatum.session?.id
                    );
                }) || null;

            if (existingAppointment === null)
                upsertApplicantMatchingDatum(newApplicantMatchingDatum);
            else
                upsertApplicantMatchingDatum({
                    ...existingAppointment,
                    min_hours_owed: newApplicantMatchingDatum.min_hours_owed,
                    max_hours_owed: newApplicantMatchingDatum.max_hours_owed,
                    prev_hours_fulfilled:
                        newApplicantMatchingDatum.prev_hours_fulfilled,
                });
        }
        onHide();
    }

    const conflicts = getConflicts(
        newApplicantMatchingDatum as ApplicantMatchingDatum,
        applicantMatchingData
    );

    return (
        <Modal show={show} onHide={onHide}>
            <Modal.Header closeButton>
                <Modal.Title>Add Appointment Guarantee</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <AppointmentEditor
                    applicantMatchingDatum={newApplicantMatchingDatum}
                    setApplicantMatchingDatum={setNewApplicantMatchingDatum}
                    applicants={applicants}
                />
                {conflicts.immediateShow ? (
                    <Alert variant="danger">{conflicts.immediateShow}</Alert>
                ) : null}
            </Modal.Body>
            <Modal.Footer>
                <Button onClick={onHide} variant="light">
                    Cancel
                </Button>
                <Button
                    onClick={createAppointment}
                    title={
                        conflicts.delayShow || "Create Appointment Guarantee"
                    }
                    disabled={
                        !!conflicts.delayShow || !!conflicts.immediateShow
                    }
                >
                    Create Appointment Guarantee
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export const ConnectedAddAppointmentDialog = connect(
    (state) => ({
        applicantMatchingData: applicantMatchingDataSelector(state),
        applicants: applicantsSelector(state),
        activeSession: activeSessionSelector(state),
    }),
    { upsertApplicantMatchingDatum }
)(AddAppointmentDialog);
