import React from "react";
import { useSelector } from "react-redux";
import {
    Alert,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import { applicantsSelector, upsertApplicant } from "../../../api/actions";
import { strip } from "../../../libs/utils";
import { Applicant } from "../../../api/defs/types";
import { ApplicantEditor } from "../../../components/applicants";
import { useThunkDispatch } from "../../../libs/thunk-dispatch";

const BLANK_APPLICANT = {
    first_name: "",
    last_name: "",
    email: "",
    utorid: "",
    phone: "",
    student_number: "",
};

/**
 * Find if there is a conflicting instructor in the passed in list
 * of instructors, or if any required fields are incorrect.
 *
 * @param {object} applicant
 * @param {object[]} applicants
 */
function getConflicts(applicant: Partial<Applicant>, applicants: Applicant[]) {
    const ret: {
        delayShow: string;
        immediateShow: React.ReactNode;
    } = { delayShow: "", immediateShow: "" };
    if (
        !strip(applicant.utorid || "") ||
        !strip(applicant.first_name || "") ||
        !strip(applicant.last_name || "")
    ) {
        ret.delayShow = "A first name, last name, and utorid is required";
    }
    const matchingApplicant = applicants.find(
        (x) => strip(x.utorid) === strip(applicant.utorid || "")
    );
    if (matchingApplicant) {
        ret.immediateShow = (
            <Typography variant="body2" color="error">
                Another applicant exists with utorid={applicant.utorid}:{" "}
                <b>
                    {matchingApplicant.first_name} {matchingApplicant.last_name}
                </b>
            </Typography>
        );
    }
    return ret;
}

export function ConnectedAddApplicantDialog(props: {
    show: boolean;
    onHide?: (...args: any) => any;
}) {
    const { show, onHide = () => {} } = props;
    const [newApplicant, setNewApplicant] =
        React.useState<Partial<Applicant>>(BLANK_APPLICANT);
    const [inProgress, setInProgress] = React.useState(false);

    const applicants = useSelector(applicantsSelector) as Applicant[];
    const dispatch = useThunkDispatch();

    function _upsertApplicant(applicant: Partial<Applicant>) {
        return dispatch(upsertApplicant(applicant));
    }

    React.useEffect(() => {
        if (!show) {
            // If the dialog is hidden, reset the state
            setNewApplicant(BLANK_APPLICANT);
        }
    }, [show]);

    async function createInstructor() {
        setInProgress(true);
        await _upsertApplicant(newApplicant);
        setInProgress(false);
        onHide();
    }

    // When a confirm operation is in progress, a spinner is displayed; otherwise
    // it's hidden
    const spinner = inProgress ? (
        <CircularProgress size={18} sx={{ mr: 1 }} />
    ) : null;

    const conflicts = getConflicts(newApplicant, applicants);

    return (
        <Dialog open={show} onClose={onHide} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ m: 0, p: 2 }}>
                Add Applicant
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
                <ApplicantEditor
                    applicant={newApplicant}
                    setApplicant={setNewApplicant}
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
                    onClick={createInstructor}
                    title={conflicts.delayShow || "Create Instructor"}
                    disabled={!!conflicts.delayShow || !!conflicts.immediateShow}
                    variant="contained"
                    color="primary"
                    startIcon={spinner}
                >
                    Create Applicant
                </Button>
            </DialogActions>
        </Dialog>
    );
}
