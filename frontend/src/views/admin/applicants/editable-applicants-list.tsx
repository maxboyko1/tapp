import React from "react";
import { useSelector } from "react-redux";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Typography,
} from "@mui/material";

import {
    applicantsSelector,
    assignmentsSelector,
    deleteApplicant,
    upsertApplicant,
} from "../../../api/actions";
import type { Applicant, Assignment } from "../../../api/defs/types";
import { ApplicantsList } from "../../../components/applicants";
import { useThunkDispatch } from "../../../libs/thunk-dispatch";
import { AdvancedColumnDef } from "../../../components/advanced-filter-table";

export function ConnectedApplicantsList({ inDeleteMode = false }) {
    const applicants = useSelector(applicantsSelector) as Applicant[];
    const assignments = useSelector(assignmentsSelector) as Assignment[];
    const [applicantToDelete, setApplicantToDelete] =
        React.useState<Applicant | null>(null);
    const dispatch = useThunkDispatch();
    const [deleteDialogVisible, setDeleteDialogVisible] = React.useState(false);

    const assignmentsHash = React.useMemo(() => {
        const hash: { [key: string]: boolean } = {};
        for (const assignment of assignments) {
            hash[assignment.applicant.id] = true;
        }
        return hash;
    }, [assignments]);

    const handleEditRow = React.useCallback(
        (original: Applicant, values: Partial<Applicant>) => {
            dispatch(upsertApplicant({ ...original, ...values }));
        },
        [dispatch]
    );

    const handleDelete = React.useCallback(
        (applicant: Applicant) => {
            setApplicantToDelete(applicant);
            setDeleteDialogVisible(true);
        },
        []
    );

    const columns: AdvancedColumnDef<Applicant>[] = React.useMemo(() => [
        {
            header: "Last Name",
            accessorKey: "last_name",
            meta: { editable: true },
        },
        {
            header: "First Name",
            accessorKey: "first_name",
            meta: { editable: true },
        },
        {
            header: "Email",
            accessorKey: "email",
            meta: { editable: true },
        },
        {
            header: "UTORid",
            accessorKey: "utorid",
            meta: { editable: true },
        },
        {
            header: "Student Number",
            accessorKey: "student_number",
            meta: { editable: true },
        },
        {
            header: "Phone",
            accessorKey: "phone",
            meta: { editable: true },
        },
    ], []);

    return (
        <React.Fragment>
            <ApplicantsList
                applicants={applicants}
                columns={columns}
                deleteable={inDeleteMode}
                onDelete={handleDelete}
                deleteBlocked={(applicant) => (
                    assignmentsHash[applicant.id]
                        ? "This applicant has an associated assignment and so cannot be deleted."
                        : false
                )}
                editable={true}
                onEditRow={handleEditRow}
            />
            <Dialog
                open={deleteDialogVisible}
                onClose={() => {
                    setDeleteDialogVisible(false);
                    setApplicantToDelete(null);
                }}
            >
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogContent>
                    <Typography variant="body2">
                        Are you sure you want to delete the applicant{" "}
                        <Typography
                            component="span"
                            color="primary"
                            fontWeight="bold"
                            display="inline"
                        >
                            {applicantToDelete
                                ? `${applicantToDelete.first_name} ${applicantToDelete.last_name}`
                                : null}
                        </Typography>
                        ? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => {
                            setDeleteDialogVisible(false);
                            setApplicantToDelete(null);
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        color="error"
                        onClick={async () => {
                            if (applicantToDelete) {
                                await dispatch(deleteApplicant(applicantToDelete));
                                setDeleteDialogVisible(false);
                                setApplicantToDelete(null);
                            }
                        }}
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </React.Fragment>
    );
}
