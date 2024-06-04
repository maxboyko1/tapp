import React from "react";
import { Modal, Button, Spinner, Alert } from "react-bootstrap";
import { 
    AppointmentEditor,
    NullableAppointment,
} from "../../../components/forms/appointment-editor";
import { ApplicantMatchingDatum, LetterTemplate } from "../../../api/defs/types";
import { useThunkDispatch } from "../../../libs/thunk-dispatch";
import { upsertApplicantMatchingDatum } from "../../../api/actions";

function generateNullableAppointment(
    applicantMatchingDatum: ApplicantMatchingDatum
): NullableAppointment {
    return {
        ...applicantMatchingDatum,
        session_id: applicantMatchingDatum.session.id,
        applicant_id: applicantMatchingDatum.applicant.id,
        letter_template_id: applicantMatchingDatum.letter_template.id,
    }
}

export function EditAppointmentDialog({
    show,
    onHide,
    applicantMatchingDatum,
    upsertApplicantMatchingDatum,
    letterTemplates,
}: {
    show: boolean;
    onHide: (...args: any[]) => void;
    applicantMatchingDatum: ApplicantMatchingDatum;
    upsertApplicantMatchingDatum: (applicantMatchingDatum: Partial<ApplicantMatchingDatum>) => any;
    letterTemplates: LetterTemplate[];
}) {
    const [newApplicantMatchingDatum, setNewApplicantMatchingDatum] =
        React.useState<NullableAppointment>(() =>
            generateNullableAppointment(applicantMatchingDatum)
        );
    const [inProgress, setInProgress] = React.useState(false);

    React.useEffect(() => {
        if (!show) {
            // If the dialog is hidden, reset the state
            setNewApplicantMatchingDatum(generateNullableAppointment(applicantMatchingDatum));
        }
    }, [show, applicantMatchingDatum]);

    async function createAppointment() {
        setInProgress(true);
        try {
            const appointmentToUpsert = { ...newApplicantMatchingDatum };
            await upsertApplicantMatchingDatum(appointmentToUpsert as Partial<ApplicantMatchingDatum>);
        } finally {
            setInProgress(false);
        }
        onHide();
    }

    // When a confirm operation is in progress, a spinner is displayed; otherwise
    // it's hidden
    const spinner = inProgress ? (
        <Spinner animation="border" size="sm" className="mr-1" />
    ) : null;

    const conflicts: { immediateShow?: React.ReactNode } = {};

    if (
        ["rejected", "pending", "accepted"].includes(
            applicantMatchingDatum.active_confirmation_status || ""
        )
    ) {
        conflicts.immediateShow = (
            <React.Fragment>
                This applicant matching currently has an active appointment confirmation. You must first{" "}
                <b>withdraw</b> the existing appointment confirmation before making a modification.
            </React.Fragment>
        );
    }

    return (
        <Modal show={show} onHide={onHide}>
            <Modal.Header closeButton>
                <Modal.Title>Edit Appointment</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <AppointmentEditor
                    applicants={[applicantMatchingDatum.applicant]}
                    applicantMatchingDatum={newApplicantMatchingDatum}
                    setApplicantMatchingDatum={setNewApplicantMatchingDatum}
                    letterTemplates={letterTemplates}
                    defaultLetterTemplate={applicantMatchingDatum.letter_template}
                    lockApplicant={true}
                />
                {!inProgress && conflicts.immediateShow ? (
                    <Alert variant="danger">{conflicts.immediateShow}</Alert>
                ) : null}
            </Modal.Body>
            <Modal.Footer>
                <Button onClick={onHide} variant="light">
                    Cancel
                </Button>
                <Button
                    onClick={createAppointment}
                    title={"Modify Appointment"}
                    disabled={!!conflicts.immediateShow}
                >
                    {spinner}
                    Modify Appointment
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export function ConnectedEditAppointmentDialog({
    applicantMatchingDatum,
    show,
    onHide,
    letterTemplates,
}: {
    applicantMatchingDatum: ApplicantMatchingDatum | null | undefined;
    show: boolean;
    onHide: (...args: any[]) => void;
    letterTemplates: LetterTemplate[];
}) {
    const dispatch = useThunkDispatch();
    const _upsertApplicantMatchingDatum = React.useCallback(
        async (applicantMatchingDatum: Partial<ApplicantMatchingDatum>) => {
            await dispatch(upsertApplicantMatchingDatum(applicantMatchingDatum));
        },
        [dispatch]
    );

    if (!applicantMatchingDatum) {
        return null;
    }

    return (
        <EditAppointmentDialog
            show={show}
            onHide={onHide}
            applicantMatchingDatum={applicantMatchingDatum}
            upsertApplicantMatchingDatum={_upsertApplicantMatchingDatum}
            letterTemplates={letterTemplates}
        />
    );
}
