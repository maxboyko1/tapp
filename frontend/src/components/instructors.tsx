import React from "react";
import PropTypes from "prop-types";
import { Box, Grid } from "@mui/material";

import { docApiPropTypes } from "../api/defs/doc-generation";
import { fieldEditorFactory } from "./forms/common-controls";
import { createDiffColumnsFromColumns } from "./diff-table";
import { AdvancedColumnDef, AdvancedFilterTable } from "./advanced-filter-table";
import { Instructor, MinimalInstructor } from "../api/defs/types";
import { DiffSpec } from "../libs/diffs";

const DEFAULT_COLUMNS: AdvancedColumnDef<Instructor>[] = [
    {   
        header: "Last Name",
        accessorKey: "last_name"
    },
    {   
        header: "First Name",
        accessorKey: "first_name"
    },
    {
        header: "Email",
        accessorKey: "email",
        minSize: 120
    },
    {   
        header: "UTORid",
        accessorKey: "utorid"
    },
];

/**
 * List the instructors using a ReactTable. `columns` can be passed
 * in to customize columns/cell renderers.
 *
 * @export
 * @param {{instructors: object[], columns: object[]}} props
 * @returns
 */
export function InstructorsList(props: {
    instructors: Omit<Instructor, "id">[];
    columns?: any[];
    deleteable?: boolean;
    onDelete?: (row: any) => void;
    deleteBlocked?: (row: any) => string | false;
    editable?: boolean;
    onEditRow?: (row: any, values: any) => void;
}) {
    const {
        instructors,
        columns = DEFAULT_COLUMNS,
        deleteable = false,
        onDelete,
        deleteBlocked,
        editable = false,
        onEditRow,
    } = props;
    return (
        <AdvancedFilterTable
            data={instructors}
            columns={columns}
            editable={editable}
            onEditRow={onEditRow}
            filterable={true}
            deleteable={deleteable}
            onDelete={onDelete}
            deleteBlocked={deleteBlocked}
        />
    );
}
InstructorsList.propTypes = {
    instructors: PropTypes.oneOfType([
        PropTypes.arrayOf(docApiPropTypes.instructor),
        PropTypes.any,
    ]).isRequired,
    columns: PropTypes.arrayOf(
        PropTypes.shape({ Header: PropTypes.any.isRequired })
    ),
};

export function InstructorsDiffList({
    modifiedInstructors,
}: {
    modifiedInstructors: DiffSpec<MinimalInstructor, Instructor>[];
}) {
    return (
        <InstructorsList
            instructors={modifiedInstructors as any[]}
            columns={createDiffColumnsFromColumns(DEFAULT_COLUMNS)}
        />
    );
}

const DEFAULT_INSTRUCTOR = {
    utorid: "",
    last_name: "",
    first_name: "",
};

/**
 * Edit information about an instructor.
 *
 * @export
 * @param {{instructor: object, setInstructor: function}} props
 * @returns
 */
export function InstructorEditor(props: {
    instructor: Partial<Instructor>;
    setInstructor: (instructor: Instructor) => any;
}) {
    const { instructor: instructorProps, setInstructor } = props;
    const instructor = { ...DEFAULT_INSTRUCTOR, ...instructorProps };

    const createFieldEditor = fieldEditorFactory<Instructor>(
        instructor as Instructor,
        setInstructor
    );

    return (
        <Box component="form" noValidate autoComplete="off">
            <Grid container spacing={2}>
                <Grid sx={{ xs: 12, sm: 6 }}>
                    {createFieldEditor("First Name", "first_name")}
                </Grid>
                <Grid sx={{ xs: 12, sm: 6 }}>
                    {createFieldEditor("Last Name", "last_name")}
                </Grid>
                <Grid sx={{ xs: 12, sm: 6 }}>
                    {createFieldEditor("Email", "email")}
                </Grid>
                <Grid sx={{ xs: 12, sm: 6 }}>
                    {createFieldEditor("UTORid", "utorid")}
                </Grid>
            </Grid>
        </Box>
    );
}
InstructorEditor.propTypes = {
    instructor: docApiPropTypes.instructor,
    setInstructor: PropTypes.func,
};
