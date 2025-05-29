import { useMemo } from "react";
import { Typography } from "@mui/material";

import { StatusCell } from "../../admin/offertable";
import { useSelector } from "react-redux";
import { activePositionSelector } from "../store/actions";
import { formatDate } from "../../../libs/utils";
import { assignmentsSelector } from "../../../api/actions";
import { AdvancedColumnDef, AdvancedFilterTable } from "../../../components/advanced-filter-table";
import { Assignment } from "../../../api/defs/types";

export function InstructorAssignmentsTable() {
    const activePosition = useSelector(activePositionSelector);
    const allAssignments = useSelector(assignmentsSelector);
    const positions = useMemo(
        () =>
            allAssignments.filter(
                (assignment) => assignment.position.id === activePosition?.id
            ),
        [activePosition, allAssignments]
    );

    if (!activePosition) {
        return (
            <Typography variant="h4" color="text.primary">
                No position currently selected
            </Typography>
        );
    }

    const columns: AdvancedColumnDef<Assignment>[] = [
        {
            header: "Last Name",
            accessorKey: "applicant.last_name",
        },
        {
            header: "First Name",
            accessorKey: "applicant.first_name",
        },
        {
            header: "UTORid",
            accessorKey: "applicant.utorid",
        },
        {
            header: "Email",
            accessorKey: "applicant.email",
            Cell: ({ cell }) => {
                const value = cell.getValue<string>();
                const applicant = cell.row.original.applicant;
                return (
                    <a
                        href={encodeURI(
                            `mailto:${applicant.first_name} ${applicant.last_name} <${value}>?subject=${activePosition.position_code}&body=Dear ${applicant.first_name} ${applicant.last_name},\n\n`
                        )}
                    >
                        {value}
                    </a>
                );
            },
        },
        {
            header: "Hours",
            accessorKey: "hours",
            maxSize: 70,
        },
        {
            header: "Offer Status",
            id: "status",
            // We want items with no active offer to appear at the end of the list
            // when sorted, so we set their accessor to null (the accessor is used by react table
            // when sorting items).
            accessorFn: (data: any) =>
                data.active_offer_status === "No Contract"
                    ? null
                    : data.active_offer_status,
            Cell: ({ cell, row }) => (
                <StatusCell
                    value={cell.getValue() as Assignment["active_offer_status"]}
                    row={row}
                />
            ),
        },
        {
            header: "Recent Activity",
            accessorKey: "active_offer_recent_activity_date",
            Cell: ({ cell }) => {
                const date = cell.getValue();
                return typeof date === "string" ? formatDate(date) : <></>;
            }
        },
    ];

    return (
        <AdvancedFilterTable
            filterable={true}
            columns={columns}
            data={positions}
        />
    );
}
