import React from "react";
import { useSelector } from "react-redux";
import { IconButton, Tooltip, Typography } from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";

import { assignmentsSelector } from "../../../api/actions";
import { ddahsSelector } from "../../../api/actions/ddahs";
import { AdvancedColumnDef, AdvancedFilterTable } from "../../../components/advanced-filter-table";
import { ddahIssues, getReadableStatus } from "../../../libs/ddah-utils";
import { formatDate } from "../../../libs/utils";
import { generateHeaderCellProps } from "../../../components/table-utils";

export interface RowData {
    id?: number;
    position_code: string;
    assignment_id: number;
    last_name: string;
    first_name: string;
    total_hours: number | null;
    status: string | null;
    emailed_date: string | null;
    issues: string | null;
    issue_code: "hours_mismatch" | "missing" | null;
}

/**
 * Cell for rendering the issues of a DDAH
 *
 * @param {{ original: RowData }} { original }
 * @returns {React.ReactNode}
 */
export function IssuesCell({
    row,
}: {
    row: { original: RowData };
}): React.JSX.Element | null {
    const { issue_code, issues } = row.original;
    if (!issues) return null;
    
    const color =
        issue_code === "hours_mismatch"
         ? "warning.main"
         : issue_code === "missing"
         ? "text.secondary"
         : "text.primary";
    
    return (
        <Typography variant="body2" sx={{ color, fontStyle: "italic" }}>
            {issues}
        </Typography>
    );
}

/**
 * Table that displays DDAH information for DDAHs associated with a single assignment.
 *
 * @export
 * @param {{
 *     assignment_id: number;
 * }} {
 *     assignment_id,
 * }
 * @returns
 */
export function ConnectedDdahsTable({
    position_id,
    onView,
    onCreate,
}: {
    position_id: number;
    onView?: (ddah_id: number) => any;
    onCreate?: (assignment_id: number) => any;
}) {
    const allAssignments = useSelector(assignmentsSelector);
    const allDdahs = useSelector(ddahsSelector);
    let ddahs = allDdahs.filter(
        (ddah) => ddah.assignment.position.id === position_id
    );
    const assignments = allAssignments.filter(
        (assignment) => assignment.position.id === position_id
    );

    // The omni-search doesn't work on nested properties, so we need to flatten
    // the data we display before sending it to the table.
    const data = ddahs.map(
        (ddah) =>
            ({
                id: ddah.id,
                assignment_id: ddah.assignment.id,
                position_code: ddah.assignment.position.position_code,
                last_name: ddah.assignment.applicant.last_name,
                first_name: ddah.assignment.applicant.first_name,
                total_hours: ddah.total_hours,
                status: ddah.status || "unsent",
                emailed_date: formatDate(ddah.emailed_date || ""),
                approved: ddah.approved_date ? "Approved" : "",
                readable_status: getReadableStatus(ddah),
                issues: ddahIssues(ddah),
                issue_code: ddahIssues(ddah) ? "hours_mismatch" : null,
            } as RowData)
    );

    function ViewOrCreateCell({
        row,
    }: {
        row: { original: RowData };
    }): React.JSX.Element | null {
        const original = row.original;
        const isExisting = original.id != null;

        const handleClick = () => {
            if (isExisting) {
                onView?.(original.id as number);
            } else {
                onCreate?.(original.assignment_id);
            }
        };

        return (
            <Tooltip
                title={
                    isExisting
                        ? `View or edit DDAH for ${original.first_name} ${original.last_name}`
                        : `Create DDAH for ${original.first_name} ${original.last_name}`
                }
            >
                <IconButton
                    size="small"
                    color={isExisting ? "info" : "primary"}
                    onClick={handleClick}
                >
                    {isExisting ? (
                        <SearchOutlinedIcon />
                    ) : (
                        <AddCircleOutlineIcon />
                    )}
                </IconButton>
            </Tooltip>
        );
    }

    // We want to also list all assignments for which there isn't a DDAH.
    // We start by hashing all the existing DDAHs
    const ddahAssignmentIdsHash = {} as { [key: string]: true };
    for (const ddah of ddahs) {
        ddahAssignmentIdsHash[ddah.assignment.id] = true;
    }
    for (const assignment of assignments) {
        if (ddahAssignmentIdsHash[assignment.id]) {
            // We have an associated DDAH
            continue;
        }
        data.push({
            position_code: assignment.position.position_code,
            assignment_id: assignment.id,
            last_name: assignment.applicant.last_name || "",
            first_name: assignment.applicant.first_name,
            total_hours: null,
            status: null,
            emailed_date: null,
            issues: "Missing DDAH",
            issue_code: "missing",
        });
    }

    // Sort the table by position_code by default
    data.sort((a, b) => {
        if (a.position_code > b.position_code) {
            return 1;
        } else if (a.position_code < b.position_code) {
            return -1;
        }
        if (a.last_name > b.last_name) {
            return 1;
        } else if (a.last_name < b.last_name) {
            return -1;
        }
        return 0;
    });

    const columns: AdvancedColumnDef<RowData>[] = [
        {
            header: "DDAH",
            Header: () => (
                <Tooltip title="View or edit a DDAH">
                    <CalendarTodayOutlinedIcon color="primary" />
                </Tooltip>
            ),
            Cell: ({ row }) => <ViewOrCreateCell row={row} />,
            id: "add_or_edit",
            size: 60,
            enableResizing: false,
            // muiTableBodyCellProps: {
            //     sx: { textAlign: "center" }
            // }
        },
        {
            ...generateHeaderCellProps("Last Name"),
            accessorKey: "last_name"
        },
        {
            ...generateHeaderCellProps("First Name"),
            accessorKey: "first_name"
        },
        {
            ...generateHeaderCellProps("DDAH Hours"),
            accessorKey: "total_hours",
            size: 50,
            muiTableBodyCellProps: {
                sx: { textAlign: "right" }
            }
        },
        {
            ...generateHeaderCellProps("Status"),
            accessorKey: "status",
            size: 100,
        },
        {
            ...generateHeaderCellProps("Emailed"),
            accessorKey: "emailed_date",
            size: 120,
            Cell: ({ row, cell }) => {
                const value = cell.getValue<string>();
                return row.original.id ? <>{value}</> : null;
            }
        },
        {
            ...generateHeaderCellProps("Approved"),
            accessorKey: "approved",
            size: 50,
            Cell: ({ cell }) =>
                cell.getValue<boolean>() ? (
                    <CheckCircleOutlineIcon color="success" />
                ) : null,
        },
        {
            ...generateHeaderCellProps("Issues"),
            accessorKey: "issues",
            size: 250,
            Cell: ({ row }) => <IssuesCell row={row} />,
        },
    ];

    return (
        <AdvancedFilterTable columns={columns} data={data} filterable={true} />
    );
}
