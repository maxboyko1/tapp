import React from "react";
import PropTypes from "prop-types";
import { Box, TextField } from "@mui/material";

import { createDiffColumnsFromColumns } from "./diff-table";
import { Applicant, MinimalApplicant } from "../api/defs/types";
import { DiffSpec } from "../libs/diffs";
import { DialogRow } from "./forms/common-controls";
import { AdvancedFilterTable, AdvancedColumnDef } from "./advanced-filter-table";


const DEFAULT_COLUMNS: AdvancedColumnDef<Applicant>[] = [
    { header: "Last Name", accessorKey: "last_name" },
    { header: "First Name", accessorKey: "first_name" },
    { header: "UTORid", accessorKey: "utorid" },
    { header: "Student Number", accessorKey: "student_number" },
    { header: "Email", accessorKey: "email" },
    { header: "Phone", accessorKey: "phone" },
];

/**
 * Display a DiffSpec array of positions and highlight the changes.
 *
 * @export
 * @param {*} { modifiedApplicants }
 * @returns
 */
export function ApplicantsDiffList({
    modifiedApplicants,
}: {
    modifiedApplicants: DiffSpec<MinimalApplicant, Applicant>[];
}) {
    return (
        <ApplicantsList
            applicants={modifiedApplicants as any[]}
            columns={createDiffColumnsFromColumns(DEFAULT_COLUMNS)}
        />
    );
}

/**
 * List the applicants using a ReactTable. `columns` can be passed
 * in to customize columns/cell renderers.
 *
 * @export
 * @param {{applicants: object[], columns: object[]}} props
 * @returns
 */
export function ApplicantsList(props: {
    applicants: (Omit<Applicant, "id"> | Applicant)[];
    columns?: any[];
    deleteable?: boolean;
    onDelete?: (row: any) => void;
    deleteBlocked?: (row: any) => string | false;
    editable?: boolean;
    onEditRow?: (row: any, values: any) => void;
}) {
    const {
        applicants,
        columns = DEFAULT_COLUMNS,
        deleteable = false,
        onDelete,
        deleteBlocked,
        editable = false,
        onEditRow,
    } = props;
    return (
        <AdvancedFilterTable
            columns={columns}
            data={applicants}
            filterable={true}
            deleteable={deleteable}
            onDelete={onDelete}
            deleteBlocked={deleteBlocked}
            editable={editable}
            onEditRow={onEditRow}
        />
    );
}
ApplicantsList.propTypes = {
    applicants: PropTypes.array.isRequired,
    columns: PropTypes.arrayOf(
        PropTypes.shape({ Header: PropTypes.any.isRequired })
    ),
};

const DEFAULT_APPLICANT = {
    first_name: "",
    last_name: "",
    email: "",
    utorid: "",
    phone: "",
    student_number: "",
};

/**
 * Edit information about an applicant.
 *
 * @export
 * @param {{instructor: object, setInstructor: function}} props
 * @returns
 */
export function ApplicantEditor(props: {
    applicant: Partial<Applicant>;
    setApplicant: (applicant: Partial<Applicant>) => void;
}) {
    const { applicant: applicantProps, setApplicant } = props;
    const applicant = { ...DEFAULT_APPLICANT, ...applicantProps };

    /**
     * Create a callback function which updates the specified attribute
     * of a position.
     *
     * @param {string} attr
     * @returns
     */
    function setAttrFactory(attr: keyof Applicant) {
        return (e: React.ChangeEvent<HTMLInputElement>) => {
            const newVal = e.target.value || "";
            const newApplicant = { ...applicant, [attr]: newVal };
            setApplicant(newApplicant);
        };
    }

    /**
     * Create a MaterialUI form component that updates the specified text attribute
     * of `position`
     *
     * @param {string} title - Label text of the form control
     * @param {string} attr - attribute of `position` to be updated when this form control changes
     * @returns {node}
     */
    function createFieldEditor(
        title: string,
        attr: keyof Applicant,
        type = "text"
    ) {
        return (
            <TextField
                label={title}
                type={type}
                value={applicant[attr] || ""}
                onChange={setAttrFactory(attr)}
                variant="outlined"
                size="small"
                fullWidth
                margin="normal"
            />
        );
    }

    return (
        <Box component="form" noValidate autoComplete="off">
            <DialogRow>
                {createFieldEditor("First Name", "first_name")}
                {createFieldEditor("Last Name", "last_name")}
            </DialogRow>
            <DialogRow>
                {createFieldEditor("Email", "email")}
                {createFieldEditor("UTORid", "utorid")}
            </DialogRow>
            <DialogRow>
                {createFieldEditor("Student Number", "student_number")}
                {createFieldEditor("Phone", "phone")} 
            </DialogRow>
        </Box>
    );
}
