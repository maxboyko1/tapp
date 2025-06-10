import React from "react";
import { useSelector } from "react-redux";
import {
    Alert,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
} from "@mui/material";

import { matchesSelector, assignmentsSelector } from "../../../api/actions";
import { useThunkDispatch } from "../../../libs/thunk-dispatch";
import { AdvancedColumnDef, AdvancedFilterTable } from "../../../components/advanced-filter-table";
import { upsertAssignment } from "../../../api/actions";
import { Assignment } from "../../../api/defs/types";

const DEFAULT_COLUMNS: AdvancedColumnDef<Assignment>[] = [
    { header: "Position Code", accessorKey: "position.position_code" },
    { header: "Hours", accessorKey: "hours_assigned" },
    { header: "Last Name", accessorKey: "applicant.last_name" },
    { header: "First Name", accessorKey: "applicant.first_name" },
    { header: "UTORid", accessorKey: "applicant.utorid" },
];

/**
 * A button that brings up a modal allowing users to see a list of staged assignments
 * and transform them into real assignments.
 */
export function FinalizeChangesButton() {
    const [dialogVisible, setDialogVisible] = React.useState(false);

    const matches = useSelector(matchesSelector);
    const assignments = useSelector(assignmentsSelector);
    const dispatch = useThunkDispatch();
    const stagedAssignments = React.useMemo(() => {
        return matches.filter((match) => {
            return (
                match.assigned &&
                !assignments.find(
                    (assignment) =>
                        assignment.applicant.id === match.applicant.id &&
                        assignment.position.id === match.position.id
                )
            );
        });
    }, [matches, assignments]);

    async function finalizeAssignments() {
        const assignmentPromises = stagedAssignments.map((match) => {
            return dispatch(
                upsertAssignment({
                    position: match.position,
                    applicant: match.applicant,
                    hours: match.hours_assigned || 0,
                })
            );
        });

        await Promise.all(assignmentPromises);
    }

    function _onConfirm() {
        if (stagedAssignments.length === 0) {
            setDialogVisible(false);
            return;
        }

        finalizeAssignments().then(() => setDialogVisible(false));
    }

    return (
        <>
            <Button
                variant="outlined"
                size="small"
                className="footer-button finalize"
                onClick={() => setDialogVisible(true)}
                disabled={stagedAssignments.length === 0}
            >
                Finalize Changes
                {stagedAssignments.length > 0
                    ? ` (${stagedAssignments.length})`
                    : ""}
            </Button>
            <Dialog
                open={dialogVisible}
                onClose={() => setDialogVisible(false)}
                maxWidth="lg"
                fullWidth
                slotProps={{ paper: { className: "finalize-changes-modal" } }}
            >
                <DialogTitle>Finalize Changes</DialogTitle>
                <DialogContent>
                    <Alert severity="info" sx={{ mb: 2 }}>
                        The following assignments will be made.
                    </Alert>
                    <AdvancedFilterTable
                        columns={DEFAULT_COLUMNS}
                        data={stagedAssignments}
                        filterable={true}
                    />
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setDialogVisible(false)}
                        variant="contained"
                        color="secondary"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={_onConfirm}
                    >
                        Confirm
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
