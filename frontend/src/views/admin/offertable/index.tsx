import React from "react";
import { useSelector } from "react-redux";
import { MRT_Row } from "material-react-table";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Popover,
    Slider,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

import {
    assignmentsSelector,
    deleteAssignment,
    upsertApplicant,
    upsertAssignment,
} from "../../../api/actions";
import { offerTableSelector, setSelectedRows } from "./actions";
import { formatDownloadUrl, capitalize, formatDate } from "../../../libs/utils";
import { splitDateRangeAtNewYear } from "../../../api/mockAPI/utils";
import { AdvancedFilterTable, AdvancedColumnDef } from "../../../components/advanced-filter-table";
import { useThunkDispatch } from "../../../libs/thunk-dispatch";
import { Applicant, Assignment, WageChunk } from "../../../api/defs/types";
import { PropsForElement } from "../../../api/defs/types/react";
import { generateDateColumnProps } from "../../../components/table-utils";

function HoursEditCell({
    value,
    row,
    onChange,
    editValues,
}: {
    value: number;
    row: MRT_Row<Assignment>;
    onChange: (val: number | { total: number; chunk1: number }) => void;
    editValues: any;
}) {
    // Use edited values if present, otherwise original
    const start_date = editValues?.["start_date"] ?? row.getValue("start_date");
    const end_date = editValues?.["end_date"] ?? row.getValue("end_date");

    const splitRanges = React.useMemo(
        () =>
            start_date && end_date
                ? splitDateRangeAtNewYear(start_date, end_date)
                : [],
        [start_date, end_date]
    );
    const isTwoTerm = splitRanges.length === 2;

    // Get wage chunk allocation from original row if present
    const wageChunks = row.original.wage_chunks ?? [];
    const fallChunk = wageChunks[0]?.hours;
    const winterChunk = wageChunks[1]?.hours;

    // Local state for editing
    const [localTotal, setLocalTotal] = React.useState(() => {
        if (
            typeof value === "object" &&
            value !== null &&
            "total" in value &&
            "chunk1" in value
        ) {
            const hoursObj = value as { total: number; chunk1: number };
            return hoursObj.total;
        } else if (isTwoTerm && fallChunk != null && winterChunk != null) {
            return fallChunk + winterChunk;
        } else if (typeof value === "number") {
            return value;
        }
        return 0;
    });

    const [localChunk1, setLocalChunk1] = React.useState(() => {
        if (
            typeof value === "object" &&
            value !== null &&
            "total" in value &&
            "chunk1" in value
        ) {
            const hoursObj = value as { total: number; chunk1: number };
            return hoursObj.chunk1;
        } else if (isTwoTerm && fallChunk != null) {
            return fallChunk;
        } else if (typeof value === "number") {
            return value / 2;
        }
        return 0;
    });

    // Reset local state if value or term structure changes
    React.useEffect(() => {
        if (isTwoTerm) {
            if (
                typeof value === "object" &&
                value !== null &&
                "total" in value &&
                "chunk1" in value
            ) {
                const hoursObj = value as { total: number; chunk1: number };
                setLocalTotal(hoursObj.total);
                setLocalChunk1(hoursObj.chunk1);
            } else if (fallChunk != null && winterChunk != null) {
                setLocalTotal(fallChunk + winterChunk);
                setLocalChunk1(fallChunk);
            } else {
                setLocalTotal(typeof value === "number" ? value : 0);
                setLocalChunk1(typeof value === "number" ? value / 2 : 0);
            }
        } else {
            setLocalTotal(typeof value === "number" ? value : 0);
            setLocalChunk1(0);
        }
    }, [value, isTwoTerm, start_date, end_date, fallChunk, winterChunk]);

    // Popover open state
    const cellRef = React.useRef<HTMLDivElement>(null);
    const [popoverOpen, setPopoverOpen] = React.useState(isTwoTerm);

    // Reopen popover if term structure or dates change
    React.useEffect(() => {
        if (isTwoTerm) setPopoverOpen(true);
        else setPopoverOpen(false);
    }, [isTwoTerm, start_date, end_date]);

    return (
        <>
            <div
                ref={cellRef}
                style={{ width: "100%", height: "100%", cursor: isTwoTerm ? "pointer" : undefined }}
                onClick={() => isTwoTerm && setPopoverOpen(true)}
            >
                {/* summary or input field */}
                {isTwoTerm ? (
                    <Typography variant="body2">
                        {localTotal} ({localChunk1} Fall, {localTotal - localChunk1} Winter)
                    </Typography>
                ) : (
                    <TextField
                        type="number"
                        value={typeof value === "number" ? value : (value as any)?.total ?? ""}
                        onChange={e => onChange(Number(e.target.value))}
                        size="small"
                        variant="standard"
                        fullWidth
                    />
                )}
            </div>
            {isTwoTerm && (
                <Popover
                    open={popoverOpen}
                    anchorEl={cellRef.current}
                    onClose={() => setPopoverOpen(false)}
                    anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                    transformOrigin={{ vertical: "top", horizontal: "right" }}
                    slotProps={{
                        paper: {
                            sx: {
                                p: 2,
                                borderRadius: 2,
                                boxShadow: 6,
                                maxWidth: 320,
                                width: "auto",
                                position: "relative",
                                "&:after": {
                                    content: '""',
                                    position: "absolute",
                                    top: "50%",
                                    right: -12,
                                    transform: "translateY(-50%)",
                                    width: 0,
                                    height: 0,
                                    borderTop: "10px solid transparent",
                                    borderBottom: "10px solid transparent",
                                    borderLeft: "12px solid",
                                    borderLeftColor: "background.paper",
                                    zIndex: 1,
                                },
                            },
                        },
                    }}
                >
                    <Stack spacing={2}>
                        <TextField
                            type="number"
                            label="Total Hours"
                            value={localTotal}
                            onChange={e => {
                                const newTotal = Number(e.target.value);
                                setLocalTotal(newTotal);
                                setLocalChunk1(newTotal / 2);
                                onChange({ total: newTotal, chunk1: newTotal / 2 });
                            }}
                            size="small"
                            variant="standard"
                            fullWidth
                        />
                        <Slider
                            color="secondary"
                            value={localChunk1}
                            min={0}
                            max={localTotal}
                            step={0.5}
                            onChange={(_, newChunk1) => {
                                setLocalChunk1(Number(newChunk1));
                                onChange({ total: localTotal, chunk1: Number(newChunk1) });
                            }}
                            valueLabelDisplay="auto"
                        />
                        <Typography variant="caption">
                            Fall: {localChunk1}h, Winter: {localTotal - localChunk1}h
                        </Typography>
                    </Stack>
                </Popover>
            )}
        </>
    );
}

/**
 * Cell to show the status of a contract and offer a download button if a contract has been created.
 * I.e., a
 *
 * @param {*} { original }
 * @returns
 */
export function StatusCell({
    value,
    row,
}: {
    value: Assignment["active_offer_status"];
    row: MRT_Row<Assignment>;
}) {
    const formattedStatus = capitalize(value || "No Contract");
    const activeOfferUrlToken = row.original.active_offer_url_token;

    return (
        <Stack direction="row" spacing={1} alignItems="center">
            {activeOfferUrlToken && (
                <Tooltip title="Download offer PDF">
                    <Button
                        href={formatDownloadUrl(`/external/contracts/${activeOfferUrlToken}.pdf`)}
                        variant="outlined"
                        size="small"
                        sx={{ minWidth: 0, padding: "2px 6px" }}
                        target="_blank"
                        rel="noopener"
                    >
                        <SearchIcon fontSize="small" />
                    </Button>
                </Tooltip>
            )}
            <Typography variant="body2">
                {formattedStatus}
            </Typography>
        </Stack>
    );
}

export function ConnectedOfferTable({
    inDeleteMode = false,
    editable = true,
    ...rest
}: {
    inDeleteMode?: boolean;
    editable?: boolean;
} & Partial<
    PropsForElement<typeof AdvancedFilterTable>
>) {
    const dispatch = useThunkDispatch();
    const selected = useSelector(offerTableSelector).selectedAssignmentIds;
    const setSelected = React.useCallback(
        (rows: number[]) => {
            const filtered = rows.filter((id) => !isNaN(id));
            if (
                filtered.length !== selected.length ||
                filtered.some((id, i) => id !== selected[i])
            ) {
                dispatch(setSelectedRows(filtered));
            }
        },
        [dispatch, selected]
    );
    const assignments = useSelector(assignmentsSelector);
    const data = React.useMemo(
        () =>
            assignments.map((assignment) =>
                assignment.active_offer_status
                    ? assignment
                    : { ...assignment, active_offer_status: "No Contract" }
            ),
        [assignments]
    );
    const [assignmentToDelete, setAssignmentToDelete] = React.useState<Assignment | null>(null);

    // Row editing and deletion is blocked for assignments that have an active offer
    const changesBlocked = React.useCallback((assignment: Assignment) => {
        if (["pending", "rejected", "accepted"].includes(assignment.active_offer_status || "")) {
            return `This assignment currently has an active offer. You must first withdraw the
                existing offer before deleting it or making a modification.`;
        }
        return false;
    }, []);

    const handleEditRow = React.useCallback(
        async (original: Assignment, values: Partial<Assignment & { [key: string]: any }>) => {
            // Split incoming values into applicant and assignment updates
            const applicantUpdates: Partial<Applicant> = {};
            const assignmentUpdates: Partial<Assignment> = {};

            Object.entries(values).forEach(([key, val]) => {
                if (key.startsWith("applicant.")) {
                    // Collect applicant field updates
                    applicantUpdates[key.replace("applicant.", "") as keyof Applicant] = val as any;
                } else {
                    // Collect assignment field updates
                    assignmentUpdates[key as keyof Assignment] = val as any;
                }
            });

            // If there are applicant updates, upsert the applicant first
            if (Object.keys(applicantUpdates).length > 0) {
                await dispatch(upsertApplicant({ ...original.applicant, ...applicantUpdates }));
            }

            // If there are assignment updates, process them
            if (Object.keys(assignmentUpdates).length > 0) {
                // Merge updates with the original assignment
                const updatedAssignment = { ...original, ...assignmentUpdates };
                // Use updated or original start/end dates and hours
                const start_date = assignmentUpdates.start_date ?? original.start_date;
                const end_date = assignmentUpdates.end_date ?? original.end_date;
                let hours = assignmentUpdates.hours ?? original.hours;

                // Determine if this is a one-term or two-term assignment
                const splitRanges = splitDateRangeAtNewYear(start_date, end_date);

                let wage_chunks: Partial<WageChunk>[] | undefined = undefined;

                if (splitRanges.length === 2) {
                    // Two-term: get allocation from assignmentUpdates.hours if it's an object, else split evenly
                    let chunk1 = hours / 2;
                    if (
                        typeof assignmentUpdates.hours === "object" &&
                        assignmentUpdates.hours !== null &&
                        "total" in assignmentUpdates.hours &&
                        "chunk1" in assignmentUpdates.hours
                    ) {
                        const hoursObj = assignmentUpdates.hours as { total: number; chunk1: number };
                        hours = hoursObj.total;
                        chunk1 = hoursObj.chunk1;
                    }
                    wage_chunks = [
                        {
                            start_date: splitRanges[0].start_date,
                            end_date: splitRanges[0].end_date,
                            hours: chunk1,
                            rate: original.wage_chunks?.[0]?.rate ?? 0,
                        },
                        {
                            start_date: splitRanges[1].start_date,
                            end_date: splitRanges[1].end_date,
                            hours: hours - chunk1,
                            rate: original.wage_chunks?.[1]?.rate ?? 0,
                        },
                    ];
                }

                // Build the payload for upsertAssignment
                const payload: any = {
                    id: updatedAssignment.id,
                    applicant_id: updatedAssignment.applicant.id,
                    position_id: updatedAssignment.position.id,
                    hours,
                    start_date,
                    end_date,
                    note: updatedAssignment.note,
                };
                if (wage_chunks) {
                    payload.wage_chunks = wage_chunks;
                }
                // Dispatch the upsertAssignment action with the payload
                await dispatch(upsertAssignment(payload));
            }
        },
        [dispatch]
    );

    const handleDelete = React.useCallback(
        (assignment: Assignment) => {
            setAssignmentToDelete(assignment);
        },
        []
    );

    const columns: AdvancedColumnDef<Assignment>[] = React.useMemo(() => {
        return [
            {
                header: "Last Name",
                accessorKey: "applicant.last_name",
                meta: { editable: editable },
            },
            {
                header: "First Name",
                accessorKey: "applicant.first_name",
                meta: { editable: editable },
            },
            {
                header: "Email",
                accessorKey: "applicant.email",
                meta: { editable: editable },
            },
            {
                header: "Student Number",
                accessorKey: "applicant.student_number",
                meta: { editable: editable },
            },
            {
                header: "Position",
                accessorKey: "position.position_code",
            },
            {
                header: "Hours",
                accessorKey: "hours",
                meta: { editable: editable },
                EditCell: ({ value, row, onChange, editValues }) => (
                    <HoursEditCell
                        value={typeof value === "number" ? value : (value as any)?.total ?? 0}
                        row={row}
                        onChange={onChange}
                        editValues={editValues}
                    />
                ),
                Cell: ({ cell, row }) => {
                    // If assignment is two-term and allocations have been set, show those
                    const value = cell.getValue() as number | { total: number; chunk1: number };
                    if (typeof value === "object" && value !== null && "total" in value && "chunk1" in value) {
                        const total = Number(value.total);
                        const chunk1 = Number(value.chunk1);
                        return (
                            <Typography variant="body2">
                                {`${total} (${chunk1} Fall, ${total - chunk1} Winter)`}
                            </Typography>
                        );
                    }
                    // If allocation has not been set between terms, default to even split
                    const numValue = typeof value === "number" ? value : 0;
                    if (row.original.wage_chunks?.length === 2) {
                        const fall = row.original.wage_chunks?.[0]?.hours ?? numValue / 2;
                        const winter = row.original.wage_chunks?.[1]?.hours ?? numValue / 2;
                        return (
                            <Typography variant="body2">
                                {`${numValue} (${fall} Fall, ${winter} Winter)`}
                            </Typography>
                        );
                    }
                    return <Typography variant="body2">{numValue}</Typography>;
                },
            },
            {
                header: "Start Date",
                accessorKey: "start_date",
                meta: { editable: editable },
                maxSize: 120,
                ...generateDateColumnProps(),
            },
            {
                header: "End Date",
                accessorKey: "end_date",
                meta: { editable: editable },
                maxSize: 120,
                ...generateDateColumnProps(),
            },
            {
                header: "Status",
                id: "status",
                // We want items with no active offer to appear at the end of the list
                // when sorted, so we set their accessor to null (the accessor is used by react table
                // when sorting items).
                accessorFn: (dat: typeof data[number]) =>
                    dat.active_offer_status === "No Contract"
                        ? null
                        : dat.active_offer_status,
                Cell: ({ cell, row }) => (
                    <StatusCell
                        value={cell.getValue() as Assignment["active_offer_status"]}
                        row={row}
                    />
                ),
            },
            {
                header: "Last Updated",
                accessorKey: "active_offer_recent_activity_date",
                Cell: ({ cell }) => {
                    const date = cell.getValue();
                    return typeof date === "string" ? formatDate(date) : <></>;
                },
                maxSize: 120,
            },
            {
                header: "Nag Count",
                accessorKey: "active_offer_nag_count",
                // If the nag-count is 0, we don't want to show it,
                // so we return null in that case, which displays nothing.
                Cell: ({ cell }) => {
                    const value = cell.getValue();
                    return value ? <>{value}</> : null;
                },
                maxSize: 30,
            },
        ];
    }, [editable]);

    return (
        <React.Fragment>
            <AdvancedFilterTable
                filterable={true}
                columns={columns}
                data={data}
                selectable={true}
                selected={selected}
                setSelected={setSelected}
                editable={editable}
                onEditRow={handleEditRow}
                editBlocked={changesBlocked}
                deleteable={inDeleteMode}
                onDelete={handleDelete}
                deleteBlocked={changesBlocked}
                {...rest}
            />
            <Dialog open={!!assignmentToDelete} onClose={() => setAssignmentToDelete(null)}>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogContent>
                    <Typography variant="body2">
                        Are you sure you want to delete the assignment for applicant{" "}
                        <Typography
                            component="span"
                            color="primary"
                            fontWeight="bold"
                            display="inline"
                        >
                            {assignmentToDelete?.applicant.first_name} {assignmentToDelete?.applicant.last_name}
                        </Typography>
                        ?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAssignmentToDelete(null)}>Cancel</Button>
                    <Button
                        color="error"
                        onClick={async () => {
                            if (assignmentToDelete) {
                                await dispatch(deleteAssignment(assignmentToDelete));
                                setAssignmentToDelete(null);
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
