import React from "react";
import { connect } from "react-redux";
import {
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    IconButton,
    Typography
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import { InstructorEditor } from "../../../components/instructors";
import { upsertInstructor, instructorsSelector } from "../../../api/actions";
import { strip } from "../../../libs/utils";
import { Instructor } from "../../../api/defs/types";

const BLANK_INSTRUCTOR = {
    first_name: "",
    last_name: "",
    email: "",
    utorid: "",
};

/**
 * Find if there is a conflicting instructor in the passed in list
 * of instructors, or if any required fields are incorrect.
 *
 * @param {object} instructor
 * @param {object[]} instructors
 */
function getConflicts(
    instructor: Partial<Instructor>,
    instructors: Instructor[]
) {
    const ret: { delayShow: string; immediateShow: React.ReactNode } = {
        delayShow: "",
        immediateShow: "",
    };
    if (
        !strip(instructor.utorid) ||
        !strip(instructor.first_name) ||
        !strip(instructor.last_name)
    ) {
        ret.delayShow = "A first name, last name, and utorid is required";
    }
    const matchingInstructor = instructors.find(
        (x) => strip(x.utorid) === strip(instructor.utorid)
    );
    if (matchingInstructor) {
        ret.immediateShow = (
            <Typography variant="body1">
                Another instructor exists with utorid={instructor.utorid}:{" "}
                <Typography component="span" fontWeight="bold">
                    {matchingInstructor.first_name} {matchingInstructor.last_name}
                </Typography>
            </Typography>
        );
    }
    return ret;
}

function AddInstructorDialog(props: {
    show: boolean;
    onHide: (...args: any[]) => void;
    instructors: Instructor[];
    upsertInstructor: (instructor: Partial<Instructor>) => any;
}) {
    const { show, onHide = () => {}, instructors, upsertInstructor } = props;
    const [newInstructor, setNewInstructor] =
        React.useState<Partial<Instructor>>(BLANK_INSTRUCTOR);

    React.useEffect(() => {
        if (!show) {
            // If the dialog is hidden, reset the state
            setNewInstructor(BLANK_INSTRUCTOR);
        }
    }, [show]);

    function createInstructor() {
        upsertInstructor(newInstructor);
        onHide();
    }

    const conflicts = getConflicts(newInstructor, instructors);

    return (
        <Dialog open={show} onClose={onHide} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ m: 0, p: 2 }}>
                Add Instructor
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
                <InstructorEditor
                    instructor={newInstructor}
                    setInstructor={setNewInstructor}
                />
                {conflicts.immediateShow ? (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        {conflicts.immediateShow}
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
                    disabled={
                        !!conflicts.delayShow || !!conflicts.immediateShow
                    }
                    variant="contained"
                    color="primary"
                >
                    Create Instructor
                </Button>
            </DialogActions>
        </Dialog>
    );
}
/**
 * AddInstructorDialog that has been connected to the redux store
 */
export const ConnectedAddInstructorDialog = connect(
    (state) => ({ instructors: instructorsSelector(state) }),
    { upsertInstructor }
)(AddInstructorDialog);
