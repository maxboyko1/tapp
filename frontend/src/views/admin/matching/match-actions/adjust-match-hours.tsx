import React from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
} from "@mui/material";

import { upsertMatch } from "../../../../api/actions";
import { useThunkDispatch } from "../../../../libs/thunk-dispatch";
import { Position } from "../../../../api/defs/types";
import { ApplicantSummary } from "../types";
import { prepApplicantMatchForPosition } from "../utils";

/**
 * A modal window allowing users to change the number of hours an applicant
 * is assigned to a course.
 */
export function AdjustHourModal({
    applicantSummary,
    position,
    show,
    setShow,
}: {
    applicantSummary: ApplicantSummary;
    position: Position;
    show: boolean;
    setShow: (arg0: boolean) => void;
}) {
    const [hoursAssigned, setHoursAssigned] = React.useState("");
    const applicantMatch = React.useMemo(() => {
        return prepApplicantMatchForPosition(applicantSummary, position);
    }, [applicantSummary, position]);

    const dispatch = useThunkDispatch();
    return (
        <Dialog open={show} onClose={() => setShow(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Update Hours</DialogTitle>
            <DialogContent>
                <TextField
                    label="Assigned Hours"
                    type="number"
                    fullWidth
                    defaultValue={applicantMatch.hours_assigned || 0}
                    onChange={(e) => setHoursAssigned(e.target.value)}
                    slotProps={{ htmlInput: { min: 0 } }}
                    sx={{ mt: 1 }}
                />
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={() => setShow(false)}
                    variant="contained"
                    color="secondary"
                >
                    Close
                </Button>
                <Button
                    disabled={hoursAssigned === ""}
                    onClick={() => {
                        dispatch(
                            upsertMatch({
                                ...applicantMatch,
                                hours_assigned: Number(hoursAssigned),
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
