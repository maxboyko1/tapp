import React from "react";
import {
    Alert,
    Autocomplete,
    Box,
    Button,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

import { createDiffColumnsFromColumns } from "./diff-table";
import { MinimalDdah, Ddah, Assignment, Duty } from "../api/defs/types";
import { DiffSpec, ddahDutiesToString } from "../libs/diffs";
import { DialogRow } from "./forms/common-controls";
import { stringToNativeType } from "../libs/urls";
import { AdvancedColumnDef, AdvancedFilterTable } from "./advanced-filter-table";
import { splitDutyDescription } from "../libs/ddah-utils";

const DEFAULT_COLUMNS: AdvancedColumnDef<Ddah>[] = [
    {
        header: "Position",
        accessorKey: "assignment.position.position_code",
        maxSize: 120,
    },
    {
        header: "Last Name",
        accessorKey: "assignment.applicant.last_name",
        maxSize: 120,
    },
    {
        header: "First Name",
        accessorKey: "assignment.applicant.first_name",
        maxSize: 120,
    },
    {
        header: "Total Hours",
        accessorKey: "total_hours",
        maxSize: 100,
        meta: {
            className: "number-cell",
        }
    },
    {
        header: "Duties",
        accessorKey: "duties"
    },
];

export type DutyCategory =
    | "note"
    | "prep"
    | "training"
    | "meeting"
    | "contact"
    | "marking"
    | "other";

/**
 * Display a DiffSpec array of positions and highlight the changes.
 *
 * @export
 * @param {*} { modifiedApplicants }
 * @returns
 */
export function DdahsDiffList({
    modifiedDdahs,
}: {
    modifiedDdahs: DiffSpec<MinimalDdah, Ddah>[];
}) {
    // We want to flatten the `Duties` list in case it is displayed,
    // it needs to be a string.
    modifiedDdahs = modifiedDdahs.map((modifiedDdah) => {
        if (
            modifiedDdah.obj.duties == null ||
            typeof modifiedDdah.obj.duties === "string"
        ) {
            return modifiedDdah;
        }
        return {
            ...modifiedDdah,
            obj: {
                ...modifiedDdah.obj,
                // Lie to typescript. This is a string, but we don't really want to mess with the types
                duties: ddahDutiesToString(modifiedDdah.obj.duties) as any,
            },
        };
    });

    return (
        <DdahsList
            ddahs={modifiedDdahs as any[]}
            columns={createDiffColumnsFromColumns(DEFAULT_COLUMNS)}
        />
    );
}

export function DdahsList(props: {
    ddahs: (Omit<Ddah, "id"> | Ddah)[];
    columns?: any[];
}) {
    const { ddahs, columns = DEFAULT_COLUMNS } = props;

    // we want to display the duties as a single string,
    // so flatten any duties that are not already a string before rendering
    const flattenedDdahs = ddahs.map((ddah) => {
        // If `ddah.duties` is null, it means that we're not actually passing
        // in a Ddah type. In this case, leave it alone. If `ddah.duties` is already
        // a string, it has been converted by something else to a string already.
        if (ddah.duties == null || typeof ddah.duties === "string") {
            return ddah;
        }
        return { ...ddah, duties: ddahDutiesToString(ddah.duties) };
    });

    return <AdvancedFilterTable data={flattenedDdahs} columns={columns} />;
}

const DEFAULT_DDAH = {
    assignment: null,
    duties: [] as Duty[],
};

interface PartialDdah {
    assignment: Assignment | null;
    duties: Duty[];
}

function DutyRow({
    duty,
    removeDuty,
    upsertDuty,
}: {
    duty: Duty;
    removeDuty: Function;
    upsertDuty: Function;
}) {
    const { category, description } = splitDutyDescription(duty.description);
    return (
        <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ mb: 2 }}>
            <Box>
                <IconButton
                    title="Remove duty"
                    onClick={() => removeDuty(duty)}
                    color="info"
                    size="small"
                >
                    <DeleteIcon />
                </IconButton>
            </Box>
            <Box sx={{ minWidth: 100 }}>
                {category === "note" ? (
                    <div />
                ) : (
                    <TextField
                        label="Hours"
                        type="number"
                        value={duty.hours}
                        onChange={(e) =>
                            upsertDuty({
                                ...duty,
                                hours: stringToNativeType(e.target.value) as any,
                            })
                        }
                        size="small"
                        fullWidth
                    />
                )}
            </Box>
            <Box sx={{ minWidth: 180 }}>
                <FormControl fullWidth size="small">
                    <InputLabel id={`category-label-${duty.order}`}>Category</InputLabel>
                    <Select
                        labelId={`category-label-${duty.order}`}
                        label="Category"
                        value={category}
                        onChange={(e) => {
                            const newCategory = e.target.value;
                            const dutyCopy = { ...duty };
                            if (newCategory === "note") {
                                dutyCopy.hours = 0;
                            }
                            upsertDuty({
                                ...dutyCopy,
                                description: `${newCategory}:${description}`,
                            });
                        }}
                    >
                        <MenuItem value="note">Note</MenuItem>
                        <MenuItem value="meeting">Meetings</MenuItem>
                        <MenuItem value="prep">Preparation</MenuItem>
                        <MenuItem value="contact">Contact time</MenuItem>
                        <MenuItem value="other">Other duties</MenuItem>
                        <MenuItem value="marking">Marking/Grading</MenuItem>
                        <MenuItem value="training">Training</MenuItem>
                    </Select>
                </FormControl>
            </Box>
            <Box sx={{ flex: 1 }}>
                <TextField
                    label="Description"
                    title="Enter a description of what these hours are allocated for"
                    type="text"
                    value={description}
                    onChange={(e) =>
                        upsertDuty({
                            ...duty,
                            description: `${category}:${e.target.value}`,
                        })
                    }
                    size="small"
                    fullWidth
                />
            </Box>
        </Stack>
    );
}

/**
 * Edit information about an applicant.
 *
 * @export
 * @param {{instructor: object, setInstructor: function}} props
 * @returns
 */
export function DdahEditor(props: {
    ddah: PartialDdah;
    setDdah: Function;
    assignments?: Assignment[];
    editableAssignment?: boolean;
}) {
    const [instructionsVisible, setInstructionsVisible] = React.useState(true);
    const {
        ddah: ddahProps,
        setDdah,
        assignments = [],
        editableAssignment = true,
    } = props;
    const ddah = { ...DEFAULT_DDAH, ...ddahProps };

    // If the assignment is editable, we have a selector for the assignments,
    // otherwise it is rendered as fixed text.
    let assignmentNode: React.ReactNode = ddah.assignment ? (
        <Typography variant="body2" component="span">
            {ddah.assignment.position.position_code} for {ddah.assignment.applicant.last_name}, {ddah.assignment.applicant.first_name}
        </Typography>
    ) : (
        <Typography variant="body2" component="span" color="text.secondary">
            No Assignment
        </Typography>
    );
    
    const assignmentsWithLabel = assignments.map((assignment) => ({
        ...assignment,
        display_title: `${assignment.position.position_code} for ${assignment.applicant.last_name}, ${assignment.applicant.first_name}`,
    }));

    if (editableAssignment) {
        assignmentNode = (
            <Autocomplete
                id="assignment-input"
                options={assignmentsWithLabel}
                getOptionLabel={(option) => option.display_title}
                value={
                    ddah.assignment?.id != null
                        ? assignmentsWithLabel.find(a => a.id === ddah.assignment!.id) || null
                        : null
                }
                onChange={(_, value) => setAssignment(value ? [value] : [])}
                renderInput={(params) => (
                    <TextField {...params} placeholder="Assignment..." size="small" />
                )}
                isOptionEqualToValue={(option, value) => option.id === value.id}
            />
        );
    }

    let instructions = (
        <Button
            variant="outlined"
            color="info"
            size="small"
            onClick={() => setInstructionsVisible(true)}
            sx={{ float: "right" }}
        >
            Show Instructions
        </Button>
    );
    if (instructionsVisible) {
        instructions = (
            <Alert
                severity="info"
                onClose={() => setInstructionsVisible(false)}
            >
                <Typography variant="body2">
                    A DDAH describes all duties and the amount of time allocated
                    to each duty. A DDAH should also include a breakdown of when
                    assignments are expected to be due, how long it will take to
                    mark them, and the expected turnaround time. This
                    information should be included in the description of every{" "}
                    <em>Marking/Grading</em> duty.
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                    Teaching Assistants shall be granted a reasonable period of time
                    of no less than 4 business days (minimum of 96 hours) to grade
                    student coursework. TAs are not expected to grade on the weekends,
                    holidays, or any of the University closure days. Any organization
                    of marking parties outside of business hours can only be done on a
                    voluntary basis and TAs must be polled their preferences to work in
                    the evenings and weekends. If no turnaround time for an assignment
                    is listed in the DDAH form, a Teaching Assistant will be required to
                    complete the assignment no less than two (2) weeks from the time
                    the supervisor informs the Teaching Assistant.
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                    In the 'Description Field' add details of when the assignments are
                    expected to be available, how long it will mark them, turnaround
                    time, and include any due dates.
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                    Sample Descriptions:
                </Typography>
                <ul style={{ marginTop: 0, marginBottom: 0 }}>
                    <li>
                        "Midterm 1; 120 tests; 10 minutes per test; available on Oct 4;
                        expected turnaround time 5 days."
                    </li>
                    <li>"Term Test 3 marking - available Oct 4, due Oct 11"</li>
                    <li>"A3 Marking (Apr 8-15 grading period)"</li>
                </ul>
                <Typography variant="body2" sx={{ mt: 1 }}>
                    A <em>Note</em> provides information that doesn't correspond
                    to specific hours. Information that should be included as a{" "}
                    <em>Note</em> include:
                </Typography>
                <ul style={{ marginTop: 0, marginBottom: 0 }}>
                    <li>
                        The{" "}
                        <em>
                            Enrollment per TA Section at the time of the DDAH
                        </em>
                    </li>
                    <li>The estimated enrollment in the course</li>
                    <li>
                        The tutorial category
                        (discussion-based/skill-development/exam
                        review/practical)
                    </li>
                    <li>
                        Whether tutorials have 30-or-less students or more than
                        30 students
                    </li>
                </ul>
            </Alert>
        );
    }

    // Make a copy of the duties so that we can sort it without mutating the prop
    const duties = [...ddah.duties];
    duties.sort((a, b) => a.order - b.order);
    const nextOrder = Math.max(...duties.map((x) => x.order), 0) + 1;
    let totalHours = 0;
    for (const duty of duties) {
        totalHours += duty.hours;
    }
    const hoursMismatch = ddah.assignment
        ? ddah.assignment.hours !== totalHours
        : false;

    function setAssignment(assignments: Assignment[]) {
        const assignment = assignments[assignments.length - 1] || null;
        setDdah({ ...ddah, assignment });
    }

    function upsertDuty(duty: Duty) {
        let newDuties = duties.filter((x) => x.order !== duty.order);
        newDuties.push(duty);
        setDdah({ ...ddah, duties: newDuties });
    }

    function removeDuty(duty: Duty) {
        let newDuties = duties.filter((x) => x.order !== duty.order);
        setDdah({ ...ddah, duties: newDuties });
    }

    return (
        <React.Fragment>
            {instructions}
            <Box component="form" noValidate autoComplete="off">
                <DialogRow>
                    <React.Fragment>
                        <Typography variant="h6" sx={{ mt: 1, mb: 1 }}>
                            Assignment
                        </Typography>
                        {assignmentNode}
                    </React.Fragment>
                </DialogRow>
                <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                    Duties
                </Typography>
                {duties.map((duty) => (
                    <DutyRow
                        duty={duty}
                        removeDuty={removeDuty}
                        upsertDuty={upsertDuty}
                        key={duty.order}
                    />
                ))}
                <DialogRow>
                    <Button
                        variant="outlined"
                        color="info"
                        onClick={() =>
                            upsertDuty({
                                description: "",
                                hours: 0,
                                order: nextOrder,
                            })
                        }
                        startIcon={<AddIcon />}
                    >
                        Add Duty
                    </Button>
                </DialogRow>
                <Box sx={{ mt: 2 }}>
                    <Typography variant="body2">
                        <Typography
                            component="span"
                            variant="body2"
                            color={hoursMismatch ? "error" : "text.primary"}
                            sx={{ fontWeight: hoursMismatch ? "bold" : "normal" }}
                        >
                            {totalHours}
                        </Typography>{" "}
                        of {ddah.assignment ? ddah.assignment.hours : "?"} hours allocated{" "}
                        {hoursMismatch
                            ? `(${(ddah.assignment?.hours || 0) - totalHours} unassigned)`
                            : ""}
                    </Typography>
                </Box>
            </Box>
        </React.Fragment>
    );
}
