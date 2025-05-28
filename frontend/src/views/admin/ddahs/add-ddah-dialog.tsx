import React from "react";
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

import { useSelector } from "react-redux";
import { Duty, Assignment, Ddah } from "../../../api/defs/types";
import { upsertDdah, ddahsSelector } from "../../../api/actions/ddahs";
import { DdahEditor } from "../../../components/ddahs";
import { assignmentsSelector } from "../../../api/actions";
import { useThunkDispatch } from "../../../libs/thunk-dispatch";

interface PartialDdah {
    assignment: Assignment | null;
    duties: Duty[];
}

const INITIAL_DDAH: PartialDdah = {
    assignment: null,
    duties: [
        {order: 1, hours: 1, description: "meeting:Meetings with instructor including initial DDAH review"},
        {order: 2, hours: 0.5, description: "meeting:Meetings with instructor including mid-term DDAH review"}
    ],
};

/**
 * Find if there is a conflicting instructor in the passed in list
 * of instructors, or if any required fields are incorrect.
 *
 * @param {object} applicant
 * @param {object[]} ddahs
 */
function getConflicts(ddah: PartialDdah, ddahs: Ddah[]) {
    const ret: {
        delayShow: string;
        immediateShow: React.ReactNode;
    } = { delayShow: "", immediateShow: "" };
    if (ddah.duties.length === 0) {
        ret.delayShow = "A DDAH must have at least one duty";
    }
    if (ddah.assignment == null) {
        ret.delayShow = "A DDAH can only be created for an existing assignment";
        return ret;
    }

    const matchingDdah = ddahs.find(
        (x) => x.assignment.id === (ddah.assignment || {}).id
    );
    if (matchingDdah) {
        ret.immediateShow = (
            <Typography variant="body2" color="error">
                Another DDAH exists for assignment=
                {ddah.assignment.position.position_code}:{" "}
                <b>
                    {matchingDdah.assignment.applicant.first_name}{" "}
                    {matchingDdah.assignment.applicant.last_name}
                </b>
            </Typography>
        );
    }
    return ret;
}

export function ConnectedAddDdahDialog(props: {
    show: boolean;
    onHide?: (...args: any) => any;
}) {
    const { show, onHide = () => {} } = props;
    const [newDdah, setNewDdah] = React.useState<PartialDdah>(INITIAL_DDAH);
    const [inProgress, setInProgress] = React.useState(false);

    const ddahs = useSelector(ddahsSelector) as Ddah[];
    const dispatch = useThunkDispatch();
    const assignmentsWithDdahHash = {} as { [key: string]: boolean };
    for (const ddah of ddahs) {
        assignmentsWithDdahHash[ddah.assignment.id] = true;
    }
    const assignmentsWithoutDdah = useSelector<any, Assignment[]>(
        assignmentsSelector
    ).filter((x) => {
        // Filter assignments without ddah and status is not withdrawn or rejected
        return (
            !assignmentsWithDdahHash[x.id] &&
            x.active_offer_status !== "withdrawn" &&
            x.active_offer_status !== "rejected"
        );
    });

    function _upsertDdah(ddah: PartialDdah) {
        if (ddah.assignment == null) {
            console.warn(
                "Trying to upsert a DDAH with a null assignment reference"
            );
            return;
        }
        const newDdah = {
            assignment_id: ddah.assignment.id,
            duties: ddah.duties,
        };
        return dispatch(upsertDdah(newDdah));
    }

    React.useEffect(() => {
        if (!show) {
            // If the dialog is hidden, reset the state
            setNewDdah(INITIAL_DDAH);
        }
    }, [show]);

    async function createDdah() {
        setInProgress(true);
        await _upsertDdah(newDdah);
        setInProgress(false);
        onHide();
    }

    const conflicts = getConflicts(newDdah, ddahs);

    // When a confirm operation is in progress, a spinner is displayed; otherwise
    // it's hidden
    const spinner = inProgress ? (
        <CircularProgress size={18} sx={{ mr: 1 }} />
    ) : null;

    return (
        <Dialog open={show} onClose={onHide} maxWidth="xl" fullWidth>
            <DialogTitle sx={{ m: 0, p: 2 }}>
                Add DDAH
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
                <DdahEditor
                    ddah={newDdah}
                    setDdah={setNewDdah}
                    assignments={assignmentsWithoutDdah}
                />
                {!inProgress && conflicts.immediateShow ? (
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
                    onClick={createDdah}
                    title={conflicts.delayShow || "Create DDAH"}
                    disabled={!!conflicts.delayShow || !!conflicts.immediateShow}
                    variant="contained"
                    color="primary"
                    startIcon={spinner}
                >
                    Create DDAH
                </Button>
            </DialogActions>
        </Dialog>
    );
}
