import PropTypes from "prop-types";

import { formatDate } from "../libs/utils";
import { createDiffColumnsFromColumns } from "./diff-table";
import { AdvancedFilterTable, AdvancedColumnDef } from "./advanced-filter-table";
import { Assignment, MinimalAssignment } from "../api/defs/types";
import { DiffSpec } from "../libs/diffs";

const DEFAULT_COLUMNS: AdvancedColumnDef<Assignment>[] = [
    {
        header: "Last Name",
        accessorKey: "applicant.last_name"
    },
    {
        header: "First Name",
        accessorKey: "applicant.first_name"
    },
    {
        header: "Position Code",
        accessorKey: "position.position_code"
    },
    {
        header: "Hours",
        accessorKey: "hours",
    },
    {
        header: "Start",
        accessorKey: "start_date",
        Cell: ({ cell }) => {
            const date = cell?.getValue?.();
            return typeof date === "string" ? formatDate(date) : <></>;
        },
    },
    {
        header: "End",
        accessorKey: "end_date",
        Cell: ({ cell }) => {
            const date = cell?.getValue?.();
            return typeof date === "string" ? formatDate(date) : <></>;
        },
    },
];

/**
 * Display a DiffSpec array of assignments and highlight the changes.
 *
 * @export
 * @param {*} { modifiedInstructors }
 * @returns
 */
export function AssignmentsDiffList({
    modifiedAssignments,
}: {
    modifiedAssignments: DiffSpec<MinimalAssignment, Assignment>[];
}) {
    return (
        <AssignmentsList
            assignments={modifiedAssignments as any[]}
            columns={createDiffColumnsFromColumns(DEFAULT_COLUMNS)}
        />
    );
}

function AssignmentsList(props: {
    assignments: (Assignment | Omit<Assignment, "id">)[];
    columns?: any[];
}) {
    const { assignments, columns = DEFAULT_COLUMNS } = props;
    return <AdvancedFilterTable data={assignments} columns={columns} />;
}
AssignmentsList.propTypes = {
    assignments: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.number,
            position: PropTypes.object,
            applicant: PropTypes.object,
        })
    ).isRequired,
};

export { AssignmentsList };
