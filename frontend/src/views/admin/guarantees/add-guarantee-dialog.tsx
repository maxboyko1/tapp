import React from "react";
import { connect } from "react-redux";
import {
    Alert,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import {
    upsertApplicantMatchingDatum,
    applicantsSelector,
    applicantMatchingDataSelector,
    activeSessionSelector,
    letterTemplatesSelector,
} from "../../../api/actions";
import { AppointmentEditor } from "../../../components/forms/appointment-editor";
import {
    Applicant,
    ApplicantMatchingDatum,
    LetterTemplate,
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
            <Typography variant="body2" color="error">
                Appointment guarantee already exists for{" "}
                <b>
                    {matchingApplicantMatchingDatum.applicant.first_name}{" "}
                    {matchingApplicantMatchingDatum.applicant.last_name} (min. hours owed: {matchingApplicantMatchingDatum.min_hours_owed})
                </b>
            </Typography>
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

    React.useEffect(() => {
        if (!show) return;
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
            setNewApplicantMatchingDatum((prev) => ({
                ...prev,
                letter_template: prev.letter_template || defaultTemplate,
            }));
        }
    }, [letterTemplates, show]);

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
        <Dialog open={show} onClose={onHide} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ m: 0, p: 2 }}>
                Add Appointment Guarantee
                <IconButton
                    aria-label="close"
                    onClick={onHide}
                    sx={{
                        position: "absolute",
                        right: 8,
                        top: 8,
                        color: (theme) => theme.palette.grey[500],
                    }}
                    size="large"
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers>
                <AppointmentEditor
                    applicantMatchingDatum={newApplicantMatchingDatum}
                    setApplicantMatchingDatum={setNewApplicantMatchingDatum}
                    applicants={applicants}
                    letterTemplates={letterTemplates}
                    defaultLetterTemplate={newApplicantMatchingDatum.letter_template}
                />
                {conflicts.immediateShow ? (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        <Typography variant="body2" color="error">
                            {conflicts.immediateShow}
                        </Typography>
                    </Alert>
                ) : null}
            </DialogContent>
            <DialogActions>
                <Button onClick={onHide} variant="contained" color="secondary">
                    Cancel
                </Button>
                <Button
                    onClick={createAppointment}
                    title={conflicts.delayShow || "Create Appointment Guarantee"}
                    disabled={!!conflicts.delayShow || !!conflicts.immediateShow}
                    variant="contained"
                    color="primary"
                >
                    Create Appointment Guarantee
                </Button>
            </DialogActions>
        </Dialog>
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
