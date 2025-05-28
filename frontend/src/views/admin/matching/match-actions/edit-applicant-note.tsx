import React from "react";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    TextField,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import { ApplicantSummary } from "../types";
import { upsertApplicantMatchingDatum } from "../../../../api/actions";
import { useThunkDispatch } from "../../../../libs/thunk-dispatch";

/**
 * A modal window allowing users to view and edit notes for an applicant.
 */
export function ApplicantNoteDialog({
    applicantSummary,
    show,
    setShow,
}: {
    applicantSummary: ApplicantSummary;
    show: boolean;
    setShow: (show: boolean) => void;
}) {
    const dispatch = useThunkDispatch();
    const [noteTemp, setNoteTemp] = React.useState(
        applicantSummary.applicantMatchingDatum?.note || ""
    );

    return (
        <Dialog open={show} onClose={() => setShow(false)} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ m: 0, p: 2 }}>
                Notes (
                {applicantSummary.applicantMatchingDatum.applicant.first_name}{" "}
                {applicantSummary.applicantMatchingDatum.applicant.last_name}
                )
                <IconButton
                    aria-label="close"
                    onClick={() => setShow(false)}
                    sx={{
                        position: 'absolute',
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
                <TextField
                    label="Note"
                    multiline
                    minRows={3}
                    fullWidth
                    value={noteTemp}
                    onChange={(e) => setNoteTemp(e.target.value)}
                    variant="outlined"
                />
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={() => setShow(false)}
                    variant="outlined"
                    color="secondary"
                >
                    Cancel
                </Button>
                <Button
                    onClick={() => {
                        dispatch(
                            upsertApplicantMatchingDatum({
                                ...applicantSummary.applicantMatchingDatum,
                                note: noteTemp,
                            })
                        );
                        setShow(false);
                    }}
                    variant="contained"
                    color="primary"
                >
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
}
