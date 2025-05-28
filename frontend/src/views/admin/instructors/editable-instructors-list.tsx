import React from "react";
import { connect } from "react-redux";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Typography,
} from "@mui/material";

import {
    instructorsSelector,
    upsertInstructor,
    deleteInstructor,
    positionsSelector,
} from "../../../api/actions";
import { InstructorsList } from "../../../components/instructors";
import { Instructor, Position } from "../../../api/defs/types";
import { useThunkDispatch } from "../../../libs/thunk-dispatch";
import { AdvancedColumnDef } from "../../../components/advanced-filter-table";

function EditableInstructorsList(props: {
    upsertInstructor: (instructor: Partial<Instructor>) => any;
    inDeleteMode: boolean;
    positions: Position[];
    instructors: Instructor[];
}) {
    const {
        upsertInstructor,
        inDeleteMode,
        positions,
        instructors,
        ...rest
    } = props;

    const dispatch = useThunkDispatch();
    const [deleteDialogVisible, setDeleteDialogVisible] = React.useState(false);
    const [instructorToDelete, setInstructorToDelete] =
        React.useState<Instructor | null>(null);

    const handleEditRow = React.useCallback(
        (original: Instructor, values: Partial<Instructor>) => {
            dispatch(upsertInstructor({ ...original, ...values }));
        },
        [dispatch, upsertInstructor]
    );

    const handleDelete = React.useCallback(
        (instructor: Instructor) => {
            setInstructorToDelete(instructor);
            setDeleteDialogVisible(true);
        },
        []
    );

    // Build a hash of instructors that are currently assigned to positions
    const instructorCurrentlyAssignedHash = React.useMemo(() => {
        const hash: Record<number, boolean> = {};
        for (const position of positions || []) {
            for (const instructor of position.instructors || []) {
                hash[instructor.id] = true;
            }
        }
        return hash;
    }, [positions]);

    const columns: AdvancedColumnDef<Instructor>[] = React.useMemo(() => [
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
            minSize: 150,
        },
        {
            header: "UTORid",
            accessorKey: "utorid",
            meta: { editable: true },
        },
    ], []);

    return (
        <React.Fragment>
            <InstructorsList
                columns={columns}
                instructors={instructors}
                editable={true}
                onEditRow={handleEditRow}
                deleteable={inDeleteMode}
                onDelete={handleDelete}
                deleteBlocked={(instructor) =>
                    instructorCurrentlyAssignedHash[instructor.id]
                        ? "This instructor is assigned to a position and cannot be deleted. Unassign the instructor from all positions to delete."
                        : false
                }
                {...rest}
            />
            <Dialog
                open={deleteDialogVisible}
                onClose={() => {
                    setDeleteDialogVisible(false);
                    setInstructorToDelete(null);
                }}
            >
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogContent>
                    <Typography variant="body2">
                        Are you sure you want to delete instructor{" "}
                        <Typography
                            component="span"
                            color="primary"
                            fontWeight="bold"
                            display="inline"
                        >
                            {instructorToDelete
                                ? `${instructorToDelete.last_name}, ${instructorToDelete.first_name}`
                                : null}
                        </Typography>
                        ? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => {
                            setDeleteDialogVisible(false);
                            setInstructorToDelete(null);
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        color="error"
                        onClick={async () => {
                            if (instructorToDelete) {
                                await dispatch(deleteInstructor(instructorToDelete));
                                setDeleteDialogVisible(false);
                                setInstructorToDelete(null);
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

/**
 * EditableInstructorsList that has been connected to the redux store
 * for live updates and editability.
 */
export const ConnectedInstructorsList = connect(
    (state) => ({
        instructors: instructorsSelector(state),
        positions: positionsSelector(state),
    }),
    { upsertInstructor }
)(EditableInstructorsList);
