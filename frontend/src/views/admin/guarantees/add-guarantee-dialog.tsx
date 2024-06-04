import React from "react";
import { connect } from "react-redux";
import {
    upsertApplicantMatchingDatum,
    applicantsSelector,
    applicantMatchingDataSelector,
    activeSessionSelector,
    letterTemplatesSelector,
} from "../../../api/actions";
import { Modal, Button, Alert } from "react-bootstrap";
import { 
    AppointmentEditor,
    NullableAppointment
} from "../../../components/forms/appointment-editor";
import {
    Applicant,
    ApplicantMatchingDatum,
    LetterTemplate,
    Session,
} from "../../../api/defs/types";

function getConflicts(
    applicantMatchingDatum: Partial<NullableAppointment>,
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

const BLANK_APPOINTMENT = {
    min_hours_owed: 0,
    max_hours_owed: null,
    prev_hours_fulfilled: null,
} as unknown as NullableAppointment;

export function AddAppointmentDialog(props: {
    show: boolean;
    onHide: (...args: any[]) => any;
    applicantMatchingData: ApplicantMatchingDatum[];
    applicants: Applicant[];
    activeSession: Session | null;
    letterTemplates: LetterTemplate[];
    upsertApplicantMatchingDatum: Function;
}) {
    const {
        show,
        onHide = () => {},
        applicantMatchingData,
        applicants,
        activeSession,
        letterTemplates,
        upsertApplicantMatchingDatum,
    } = props;
    const [newApplicantMatchingDatum, setNewApplicantMatchingDatum] =
        React.useState<NullableAppointment>(
            BLANK_APPOINTMENT as NullableAppointment
        );

    React.useEffect(() => {
        if (!show) {
            // If the dialog is hidden, reset the state
            setNewApplicantMatchingDatum({
                ...BLANK_APPOINTMENT,
                session_id: activeSession?.id || -1,
            });
        }
    }, [show, activeSession]);

    // select a suitable default for the letter template
    React.useEffect(() => {
        // Look for a letter template whose name is "standard" or "default";
        // If that fails, find one whose name contains "standard" or "default";
        // If all else fails, pick the first template in the list
        const defaultTemplate =
            letterTemplates.find(
                (x) => x.template_name.toLowerCase() === "standard"
            ) ||
            letterTemplates.find(
                (x) => x.template_name.toLowerCase() === "default"
            ) ||
            letterTemplates.find((x) =>
                x.template_name.toLowerCase().includes("standard")
            ) ||
            letterTemplates.find((x) =>
                x.template_name.toLowerCase().includes("default")
            ) ||
            letterTemplates[0];
        if (defaultTemplate) {
            newApplicantMatchingDatum.letter_template = defaultTemplate;
        }
    }, [letterTemplates, newApplicantMatchingDatum]);

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
                    letter_template: newApplicantMatchingDatum.letter_template,
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
                    letterTemplates={letterTemplates}
                    defaultLetterTemplate={newApplicantMatchingDatum.letter_template}
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
        letterTemplates: letterTemplatesSelector(state),
    }),
    { upsertApplicantMatchingDatum }
)(AddAppointmentDialog);
