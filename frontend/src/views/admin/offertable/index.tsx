import React from "react";
import { useSelector } from "react-redux";
import { MRT_Row } from "material-react-table";
import { Button, Stack, Tooltip, Typography } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

import {
    assignmentsSelector,
    upsertApplicant,
    upsertAssignment,
} from "../../../api/actions";
import { offerTableSelector, setSelectedRows } from "./actions";
import { formatDownloadUrl, capitalize, formatDate } from "../../../libs/utils";
import { AdvancedFilterTable, AdvancedColumnDef } from "../../../components/advanced-filter-table";
import { useThunkDispatch } from "../../../libs/thunk-dispatch";
import { Applicant, Assignment } from "../../../api/defs/types";
import { PropsForElement } from "../../../api/defs/types/react";
import { generateDateColumnProps, generateNumberCell } from "../../../components/table-utils";

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
    editable = true,
    ...rest
}: { editable?: boolean } & Partial<
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

    // Row editing is blocked for assignments that have an active offer
    const editBlocked = React.useCallback((assignment: Assignment) => {
        if (["pending", "rejected", "accepted"].includes(assignment.active_offer_status || "")) {
            return `This assignment currently has an active offer. You must first withdraw the
                existing offer before making a modification.`;
        }
        return false;
    }, []);

    const handleEditRow = React.useCallback(
        async (original: Assignment, values: Partial<Assignment & { [key: string]: any }>) => {
            // Split values into applicant and assignment updates
            const applicantUpdates: Partial<Applicant> = {};
            const assignmentUpdates: Partial<Assignment> = {};

            Object.entries(values).forEach(([key, val]) => {
                if (key.startsWith("applicant.")) {
                    applicantUpdates[key.replace("applicant.", "") as keyof Applicant] = val as any;
                } else {
                    assignmentUpdates[key as keyof Assignment] = val as any;
                }
            });

            if (Object.keys(applicantUpdates).length > 0) {
                await dispatch(upsertApplicant({ ...original.applicant, ...applicantUpdates }));
            }

            if (Object.keys(assignmentUpdates).length > 0) {
                // If start_date or end_date changed, update wage_chunks accordingly
                const updatedAssignment = { ...original, ...assignmentUpdates };
                if (
                    assignmentUpdates.start_date !== undefined ||
                    assignmentUpdates.end_date !== undefined
                ) {
                    const oldChunk = original.wage_chunks?.[0];
                    updatedAssignment.wage_chunks = [
                        {
                            id: oldChunk?.id ?? 0,
                            rate: oldChunk?.rate ?? 0,
                            start_date: assignmentUpdates.start_date ?? original.start_date,
                            end_date: assignmentUpdates.end_date ?? original.end_date,
                            hours: assignmentUpdates.hours ?? original.hours,
                        },
                    ];
                }
                // Only send the fields the backend expects
                const payload = {
                    id: updatedAssignment.id,
                    applicant_id: updatedAssignment.applicant.id,
                    position_id: updatedAssignment.position.id,
                    hours: updatedAssignment.hours,
                    start_date: updatedAssignment.start_date,
                    end_date: updatedAssignment.end_date,
                    note: updatedAssignment.note,
                    wage_chunks: updatedAssignment.wage_chunks,
                };
                await dispatch(upsertAssignment(payload));
            }
        },
        [dispatch]
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
                EditCell: generateNumberCell(),
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
        <AdvancedFilterTable
            filterable={true}
            columns={columns}
            data={data}
            selectable={true}
            selected={selected}
            setSelected={setSelected}
            editable={editable}
            onEditRow={handleEditRow}
            editBlocked={editBlocked}
            {...rest}
        />
    );
}
