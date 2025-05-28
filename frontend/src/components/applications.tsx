import PropTypes from "prop-types";
import { AdvancedColumnDef, AdvancedFilterTable } from "./advanced-filter-table";
import { Application } from "../api/defs/types";

const DEFAULT_COLUMNS: AdvancedColumnDef<Application>[] = [
    { header: "Last Name", accessorKey: "applicant.last_name" },
    { header: "First Name", accessorKey: "applicant.first_name" },
    { header: "UTORid", accessorKey: "applicant.utorid" },
    { header: "Student Number", accessorKey: "applicant.student_number" },
    { header: "Email", accessorKey: "applicant.email" },
    { header: "Phone", accessorKey: "applicant.phone" },
];

/**
 * List the applicants using a ReactTable. `columns` can be passed
 * in to customize columns/cell renderers.
 *
 * @export
 * @param {{applicants: object[], columns: object[]}} props
 * @returns
 */
export function ApplicationsList(props: {
    applicants: (Omit<Application, "id"> | Application)[];
    columns?: any[];
    onEditRow?: (row: any, values: any) => void;
}) {
    const { applicants, columns = DEFAULT_COLUMNS, onEditRow } = props;
    return (
        <AdvancedFilterTable
            columns={columns}
            data={applicants}
            filterable={true}
            editable={true}
            onEditRow={onEditRow}
        />
    );
}
ApplicationsList.propTypes = {
    applicants: PropTypes.array.isRequired,
    columns: PropTypes.arrayOf(
        PropTypes.shape({ Header: PropTypes.any.isRequired })
    ),
};
