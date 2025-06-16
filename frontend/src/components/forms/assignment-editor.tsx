import React from "react";
import PropTypes from "prop-types";
import {
    Autocomplete,
    Box,
    TextField,
    Typography,
} from "@mui/material";

import { docApiPropTypes } from "../../api/defs/doc-generation";
import { fieldEditorFactory, DialogRow } from "./common-controls";
import { splitDateRangeAtNewYear } from "../../api/mockAPI/utils";
import {
    Applicant,
    Assignment,
    Position,
    RequireSome,
    WageChunk,
} from "../../api/defs/types";

export interface NullableAssignment
    extends Omit<Assignment, "id" | "wage_chunks"> {
    id?: Assignment["id"] | null;
    wage_chunks?:
        | RequireSome<WageChunk, "start_date" | "end_date" | "hours">[]
        | null;
    position_id?: number | null;
    applicant_id?: number | null;
}

/**
 * Adds up all the hours for the wage chunks belonging to an assignment and
 * returns true or false based on whether they match the number of hours for the
 * assignment.
 */
function assignmentAndWageChunkHoursMatch(assignment: NullableAssignment) {
    if (!Array.isArray(assignment.wage_chunks)) {
        return true;
    }
    let totalHours = 0;
    for (const chunk of assignment.wage_chunks) {
        totalHours += chunk.hours;
    }
    return totalHours === assignment.hours;
}

function assignmentAndWageChunkDatesMatch(assignment: NullableAssignment) {
    if (!Array.isArray(assignment.wage_chunks)) {
        return true;
    }
    if (assignment.wage_chunks.length === 0) {
        return false;
    }
    const wageChunks = [...assignment.wage_chunks];
    // Sort the wage chunks. We assume they don't overlap!
    wageChunks.sort((a, b) => {
        const aDate = new Date(a.start_date);
        const bDate = new Date(b.start_date);
        if (aDate === bDate) {
            return 0;
        }
        if (aDate > bDate) {
            return 1;
        }
        return -1;
    });
    const firstChunk = wageChunks[0];
    const lastChunk = wageChunks[wageChunks.length - 1];

    return (
        firstChunk.start_date === assignment.start_date &&
        lastChunk.end_date === assignment.end_date
    );
}

const DEFAULT_ASSIGNMENT = {
    note: "",
    position: { id: null },
    position_id: null,
    applicant: { id: null },
    applicant_id: null,
};

/**
 * Edit information about an Assignment. If `lockPositionAndApplicant` is set
 * to true, the position and applicant cannot be edited.
 */
export function AssignmentEditor(props: {
    assignment: NullableAssignment;
    setAssignment: (assignment: NullableAssignment) => any;
    applicants: Applicant[];
    positions: Position[];
    lockPositionAndApplicant?: boolean;
}) {
    const {
        assignment: assignmentProp,
        setAssignment,
        applicants,
        positions,
        lockPositionAndApplicant,
    } = props;
    const assignment = React.useMemo(
        () => ({ ...DEFAULT_ASSIGNMENT, ...assignmentProp }),
        [assignmentProp]
    );
    const positionsWithTitle = positions.map((position) => ({
        ...position,
        display_title: `${position.position_code} (${position.position_title})`,
    }));
    const applicantsWithFullName = applicants.map((applicant) => ({
        ...applicant,
        full_name: `${applicant.first_name} ${applicant.last_name}`,
    }));

    React.useEffect(() => {
        // Create or destroy wage chunks based on whether an assignment's dates
        // cross the January 1 boundary.
        if (!assignment.start_date || !assignment.end_date) {
            // If there are no dates, unset any existing wage chunks and
            // return.
            if (assignment.wage_chunks) {
                setAssignment({ ...assignment, wage_chunks: null });
            }
            return;
        }
        const splitDateRanges = splitDateRangeAtNewYear(
            assignment.start_date,
            assignment.end_date
        );
        // splitDateRanges will have two ranges if we cross Jan 1 and one range otherwise.
        if (splitDateRanges.length === 1) {
            // With only one date range, we have no need for wage chunks.
            if (assignment.wage_chunks) {
                setAssignment({ ...assignment, wage_chunks: null });
            }
            return;
        }

        // If we made it here, we cross the January first boundary and have exactly two date ranges
        if (
            assignment.wage_chunks == null ||
            !assignmentAndWageChunkHoursMatch(assignment) ||
            !assignmentAndWageChunkDatesMatch(assignment)
        ) {
            const wage_chunks = splitDateRanges.map((range) => ({
                ...range,
                hours: assignment.hours / 2,
            }));
            setAssignment({ ...assignment, wage_chunks });
        }
    }, [assignment, setAssignment]);

    // update the selected position; this comes with side effects
    function setPosition(positions: Position[]) {
        const position = positions[positions.length - 1] || { id: null };
        setAssignment({
            ...assignment,
            position,
            position_id: position.id,
            hours: position.hours_per_assignment,
            start_date: position.start_date,
            end_date: position.end_date,
        });
    }

    // update the selected applicant
    function setApplicant(applicants: Applicant[]) {
        const applicant = applicants[applicants.length - 1] || { id: null };
        setAssignment({
            ...assignment,
            applicant,
            applicant_id: applicant.id,
        });
    }

    const createFieldEditor = fieldEditorFactory(assignment, setAssignment);

    let wageChunkAdjuster1 = <React.Fragment></React.Fragment>;
    let wageChunkAdjuster2 = <React.Fragment></React.Fragment>;
    if (assignment.wage_chunks != null) {
        // If there are any wage chunks, there are exactly two of them,
        // one for pre-January and one for post.
        const wageChunks = assignment.wage_chunks;
        wageChunkAdjuster1 = (
            <>
                <Typography variant="body2" sx={{ mb: 1 }}>
                    F Hours
                </Typography>
                <TextField
                    type="number"
                    label="F Hours"
                    title="The number of pre-January hours"
                    value={wageChunks[0].hours}
                    onChange={(e) => {
                        const newHours = Math.min(
                            Math.max(Number(e.target.value), 0),
                            assignment.hours
                        );
                        setAssignment({
                            ...assignment,
                            wage_chunks: [
                                { ...wageChunks[0], hours: newHours },
                                {
                                    ...wageChunks[1],
                                    hours: assignment.hours - newHours,
                                },
                            ],
                        });
                    }}
                    size="small"
                    fullWidth
                    margin="normal"
                />
            </>
        );

        wageChunkAdjuster2 = (
            <>
                <Typography variant="body2" sx={{ mb: 1 }}>
                    S Hours
                </Typography>
                <TextField
                    type="number"
                    label="S Hours"
                    title="The number of post-January hours. This value cannot be set directly. You must set the number of pre-January hours."
                    disabled
                    value={wageChunks[1]?.hours}
                    size="small"
                    fullWidth
                    margin="normal"
                />
            </>
        );
    }

    return (
        <Box component="form" noValidate autoComplete="off">
            <DialogRow>
                <React.Fragment>
                    <Autocomplete
                        id="position-input"
                        options={positionsWithTitle}
                        getOptionLabel={(option) =>
                            `${option.position_code} (${option.position_title})`
                        }
                        value={
                            assignment.position.id == null
                                ? null
                                : positionsWithTitle.find(
                                    (p) => p.id === assignment.position.id
                                ) || null
                        }
                        onChange={(_, value) =>
                            setPosition(value ? [value] : [])
                        }
                        renderInput={(params) => (
                            <TextField {...params} placeholder="Position..." size="small" />
                        )}
                        disabled={lockPositionAndApplicant}
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                        slotProps={{
                            paper: {
                                sx: (theme) => ({
                                    backgroundColor: theme.palette.primary.main,
                                    color: theme.palette.primary.contrastText,
                                })
                            }
                        }}
                    />
                </React.Fragment>
                <React.Fragment>
                    <Autocomplete
                        id="applicant-input"
                        options={applicantsWithFullName}
                        getOptionLabel={(option) =>
                            `${option.first_name} ${option.last_name}`
                        }
                        value={
                            assignment.applicant.id == null
                                ? null
                                : applicantsWithFullName.find(
                                    (a) => a.id === assignment.applicant.id
                                ) || null
                        }
                        onChange={(_, value) =>
                            setApplicant(value ? [value] : [])
                        }
                        renderInput={(params) => (
                            <TextField {...params} placeholder="Applicant..." size="small" />
                        )}
                        disabled={lockPositionAndApplicant}
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                        slotProps={{
                            paper: {
                                sx: (theme) => ({
                                    backgroundColor: theme.palette.primary.main,
                                    color: theme.palette.primary.contrastText,
                                })
                            }
                        }}
                    />
                </React.Fragment>
            </DialogRow>
            <DialogRow>
                {createFieldEditor("Hours", "hours", "number")}
            </DialogRow>

            <Typography variant="h6" sx={{ mt: 2 }}>
                Optional Settings
            </Typography>
            <DialogRow>
                {createFieldEditor("Start Date", "start_date", "date")}
                {createFieldEditor("End Date", "end_date", "date")}
            </DialogRow>
            <DialogRow>
                {wageChunkAdjuster1}
                {wageChunkAdjuster2}
            </DialogRow>
        </Box>
    );
}
AssignmentEditor.propTypes = {
    assignment: docApiPropTypes.assignment.isRequired,
    setAssignment: PropTypes.func.isRequired,
    positions: PropTypes.arrayOf(docApiPropTypes.position),
    applicants: PropTypes.arrayOf(docApiPropTypes.applicant),
};
