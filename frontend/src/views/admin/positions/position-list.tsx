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
    contractTemplatesSelector,
    instructorsSelector,
    positionsSelector,
    deletePosition,
    assignmentsSelector,
    upsertPosition,
} from "../../../api/actions";
import { PositionsList } from "../../../components/positions-list";
import { generateDateColumnProps, generateMultiSelectColumnProps, generateNumberCell, generateSingleSelectColumnProps } from "../../../components/table-utils";
import { useThunkDispatch } from "../../../libs/thunk-dispatch";
import { Position } from "../../../api/defs/types";
import { positionsTableSelector, setSelectedRows } from "./actions";
import { EditCustomQuestionsCell } from "./custom-questions-cell";
import { AdvancedColumnDef } from "../../../components/advanced-filter-table";
import { generateFixedDateColumnProps } from "../../../components/table-utils";

export function ConnectedPositionsList({
    inDeleteMode = false,
    editable = true,
    columns = null,
}: {
    inDeleteMode?: boolean;
    editable?: boolean;
    columns?: AdvancedColumnDef<Position>[] | null;
}) {
    const positions = useSelector(positionsSelector);
    const assignments = useSelector(assignmentsSelector);
    const allInstructors = useSelector(instructorsSelector);
    const allTemplates = useSelector(contractTemplatesSelector);

    const [positionToDelete, setPositionToDelete] =
        React.useState<Position | null>(null);
    const dispatch = useThunkDispatch();
    const selectedPositionIds = useSelector(positionsTableSelector).selectedPositionIds;

    const numAssignmentsByPositionCode = React.useMemo(
        () =>
            assignments.reduce((acc, assignment) => {
                const position_code = assignment.position.position_code;
                acc[position_code] = acc[position_code] || 0;
                acc[position_code] += 1;
                return acc;
            }, {} as Record<string, number>),
        [assignments]
    );

    const handleEditRow = React.useCallback(
        (original: Position, values: Partial<Position>) => {
            dispatch(upsertPosition({ ...original, ...values }));
        },
        [dispatch]
    );

    const handleDelete = React.useCallback(
        (position: Position) => {
            const hasAssignments = numAssignmentsByPositionCode[position.position_code];
            if (hasAssignments) {
                alert("This position has associated assignments and so cannot be deleted.");
                return;
            }
            setPositionToDelete(position);
        },
        [numAssignmentsByPositionCode]
    );

    const setSelected = React.useCallback(
        (rows: number[]) => {
            const filtered = rows.filter((id) => !isNaN(id));
            if (
                filtered.length !== selectedPositionIds.length ||
                filtered.some((id, i) => id !== selectedPositionIds[i])
            ) {
                dispatch(setSelectedRows(filtered));
            }
        },
        [dispatch, selectedPositionIds]
    );

    const DEFAULT_COLUMNS: AdvancedColumnDef<Position>[] = React.useMemo(() => [
        {
            header: "Position Code",
            accessorKey: "position_code",
            meta: { editable: {editable} },
        },
        {
            header: "Position Title",
            accessorKey: "position_title",
            meta: { editable: {editable} },
        },
        {
            header: "Start",
            accessorKey: "start_date",
            meta: { editable: {editable} },
            ...generateDateColumnProps(),
        },
        {
            header: "End",
            accessorKey: "end_date",
            meta: { editable: {editable} },
            ...generateDateColumnProps(),
        },
        {
            header: "Instructor(s)",
            id: "instructors",
            accessorKey: "instructors",
            meta: { editable: {editable} },
            ...generateMultiSelectColumnProps({
                options: allInstructors,
                getLabel: (option) => `${option.first_name} ${option.last_name}`,
            }),
        },
        {
            header: "Last Emailed Date",
            ...generateFixedDateColumnProps<Position>("last_emailed_date"),
        },
        {
            header: "Hours/Assignment",
            accessorKey: "hours_per_assignment",
            size: 64,
            meta: { editable: {editable} },
            EditCell: generateNumberCell(),
        },
        {
            header: "Enrolled",
            accessorKey: "current_enrollment",
            maxSize: 80,
            meta: { editable: {editable} },
            EditCell: generateNumberCell(),
        },
        {
            header: "Waitlist",
            accessorKey: "current_waitlisted",
            size: 50,
            meta: { editable: {editable} },
            EditCell: generateNumberCell(),
        },
        {
            header: "Desired Assignments",
            accessorKey: "desired_num_assignments",
            meta: { editable: {editable} },
            size: 50,
            EditCell: generateNumberCell(),
        },
        {
            header: "Assigned",
            id: "current_num_assignments",
            accessorFn: (position: Position) =>
                numAssignmentsByPositionCode[position.position_code] || "",
            size: 50,
        },
        {
            header: "Contract Template",
            accessorKey: "contract_template",
            meta: { editable: {editable} },
            ...generateSingleSelectColumnProps({
                options: allTemplates,
                getLabel: (option) => option?.template_name ?? "",
            })
        },
        {
            header: "Custom Questions",
            id: "custom_questions",
            Cell: EditCustomQuestionsCell,
        },
    ], [editable, allInstructors, allTemplates, numAssignmentsByPositionCode]);

    return (
        <React.Fragment>
            <PositionsList
                positions={positions}
                columns={columns || DEFAULT_COLUMNS}
                filterable={true}
                selectable={true}
                selected={selectedPositionIds}
                setSelected={setSelected}
                deleteable={inDeleteMode}
                onDelete={handleDelete}
                deleteBlocked={(position) =>
                    numAssignmentsByPositionCode[position.position_code]
                        ? "This position has associated assignments and cannot be deleted."
                        : false
                }
                editable={editable}
                onEditRow={handleEditRow}
            />
            <Dialog open={!!positionToDelete} onClose={() => setPositionToDelete(null)}>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogContent>
                    <Typography variant="body2">
                        Are you sure you want to delete the position{" "}
                        <Typography
                            component="span"
                            color="primary"
                            fontWeight="bold"
                            display="inline"
                        >
                            {positionToDelete?.position_code}
                        </Typography>
                        ?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPositionToDelete(null)}>Cancel</Button>
                    <Button
                        color="error"
                        onClick={async () => {
                            if (positionToDelete) {
                                await dispatch(deletePosition(positionToDelete));
                                setPositionToDelete(null);
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
