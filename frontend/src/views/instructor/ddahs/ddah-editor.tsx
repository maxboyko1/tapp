import React from "react";
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    IconButton,
    List,
    ListItem,
    Stack,
    TextField,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableRow,
} from "@mui/material";
import Add from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import Delete from "@mui/icons-material/Delete";
import Download from "@mui/icons-material/Download";
import Edit from "@mui/icons-material/Edit";
import Save from "@mui/icons-material/Save";

import type { Ddah, Duty } from "../../../api/defs/types";
import { formatDate, formatDownloadUrl } from "../../../libs/utils";
import { splitDutyDescription } from "./../../../libs/ddah-utils";
import { stringToNativeType } from "../../../libs/urls";
import { DutyCategory } from "../../../components/ddahs";

import "./style.css";

const categoryInformation: Record<
    DutyCategory,
    { title: string; helpText: string }
> = {
    note: {
        title: "Notes",
        helpText:
            "As notes, you must list (a) the enrollment per TA Section at the time of the DDAH, (b) the estimated course enrollment, (c) the tutorial category (discussion-based/skill-development/exam review/practical), and (d) whether tutorials have 30-or-less or more than 30 students. You may list this information in one note or in multiple notes.",
    },
    prep: {
        title: "Preparation",
        helpText:
            "Preparation time must include at least 1 hour per different tutorial lesson. If a TA runs the same tutorial multiple times, the prep time may be the same as if the TA ran the tutorial only once.",
    },
    training: { title: "Training", helpText: "" },
    meeting: {
        title: "Meetings",
        helpText:
            "Meetings must include a minimum of 1.0 hour at the start of the term that includes: the DDAH review and any other items you wish to cover. An additional 0.5 hours is required for a mid-semester check-in that includes where you discuss with the TA whether their workload is appropriately balanced, whether the DDAH needs to be modified and any other items you wish to cover.",
    },
    contact: {
        title: "Contact Time",
        helpText:
            "Tutorials, Lecture TAing, and Office Hours should be listed here.",
    },
    marking: {
        title: "Marking/Grading",
        helpText:
            'Teaching Assistants shall be granted a reasonable period of time of no less than 4 business days (minimum of 96 hours) to grade student coursework. TAs are not expected to grade on the weekends, holidays, or any of the University closure days. Any organization of marking parties outside of business hours can only be done on a voluntary basis and TAs must be polled their preferences to work in the evenings and weekends. If no turnaround time for an assignment is listed in the DDAH form, a Teaching Assistant will be required to complete the assignment no less than two (2) weeks from the time the supervisor informs the Teaching Assistant.'
            + '<p/><p>In the \'Description Field\' add details of when the assignments are expected to be available, how long it will mark them, turnaround time, and include any due dates.</p>'
            + '<p>Sample Descriptions:<br/>"Midterm 1; 120 tests; 10 minutes per test; available on Oct 4; expected turnaround time 5 days."<br/>“Term Test 3 marking - available Oct 4, due Oct 11”<br/>“A3 Marking (Apr 8-15 grading period)”</p>'

    },
    other: { title: "Other duties", helpText: "" },
};

function DutyList({
    category,
    duties,
    showEmptyDutyString = true,
    editable = true,
    onChange,
    onDelete,
    onNew,
}: {
    category: DutyCategory;
    duties: Duty[];
    showEmptyDutyString?: boolean;
    editable?: boolean;
    onChange?: (category: DutyCategory, duty: Duty) => any;
    onDelete?: (duty: Duty) => any;
    onNew?: (category: DutyCategory) => any;
}): React.ReactElement | null {
    if (!duties) {
        return null;
    }
    const addNew =
        editable && onNew ? (
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                <Button
                    title="Add Duty"
                    onClick={() => onNew && onNew(category)}
                    variant="outlined"
                    size="small"
                    startIcon={<Add />}
                >
                    Add
                </Button>
            </Stack>
        ) : null;
    if (showEmptyDutyString && duties.length === 0) {
        return (
            <>
                {addNew || (
                    <Typography variant="body2" color="textSecondary" sx={{ pl: 2 }}>
                        No Duties Listed
                    </Typography>
                )}
            </>
        );
    }
    return (
        <>
            {duties.map((duty) =>
                editable ? (
                    <DutyItem
                        key={duty.order}
                        category={category}
                        duty={duty}
                        onChange={onChange}
                        onDelete={onDelete}
                    />
                ) : (
                    <DutyItem
                        key={duty.order}
                        category={category}
                        duty={duty}
                    />
                )
            )}
            {addNew}
        </>
    );
}

function DutyItem({
    category,
    duty,
    onChange,
    onDelete,
}: {
    category: DutyCategory;
    duty: Duty;
    onChange?: (category: DutyCategory, duty: Duty) => any;
    onDelete?: (duty: Duty) => any;
}) {
    if (onChange) {
        return (
            <ListItem
                disableGutters
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    py: 1,
                }}
            >
                {category !== "note" && (
                    <TextField
                        label="Hours"
                        type="number"
                        size="small"
                        value={duty.hours}
                        onChange={(
                            e: React.ChangeEvent<HTMLInputElement>
                        ) =>
                            onChange(category, {
                                ...duty,
                                hours: stringToNativeType(
                                    e.target.value
                                ) as any,
                            })
                        }
                        sx={{ width: 100 }}
                        slotProps={{ htmlInput: { min: 0 } }}
                    />
                )}
                <TextField
                    label={category === "note" ? "Note" : "Description"}
                    title={
                        category === "note"
                            ? "Enter a note"
                            : "Enter a description of what these hours are allocated for"
                    }
                    type="text"
                    size="small"
                    value={duty.description}
                    onChange={(
                        e: React.ChangeEvent<HTMLInputElement>
                    ) =>
                        onChange(category, {
                            ...duty,
                            description: e.target.value,
                        })
                    }
                    fullWidth
                    sx={{ flex: 1 }}
                />
                {onDelete && (
                    <IconButton
                        title="Remove duty"
                        onClick={() => onDelete(duty)}
                        color="info"
                        size="small"
                        sx={{ ml: 1 }}
                    >
                        <Delete />
                    </IconButton>
                )}
            </ListItem>
        );
    }
    return (
        <ListItem disableGutters>
            {category !== "note" && (
                <Typography variant="body2" sx={{ minWidth: 40, fontWeight: "bold" }}>
                    {duty.hours}
                </Typography>
            )}
            <Typography variant="body2" sx={{ ml: 2 }}>
                {duty.description}
            </Typography>
        </ListItem>
    );
}

export function DdahPreviewModal({
    ddah,
    show,
    onHide: _onHide = () => {},
    onEdit = () => {},
    forceEditMode = false,
}: {
    ddah: Omit<Ddah, "id"> | null;
    show: boolean;
    onHide?: Function;
    onEdit?: Function;
    forceEditMode?: boolean;
}): React.ReactElement {
    let ddahPreview: React.ReactElement | string = "No DDAH to preview";
    let url: string | null = null;
    const receivedDuties = React.useMemo(() => {
        const ret = ddah ? [...ddah.duties] : [];
        ret.sort((a, b) => a.order - b.order);
        return ret;
    }, [ddah]);

    const [duties, setDuties] = React.useState(receivedDuties);
    const [_editing, setEditing] = React.useState(false);
    const editing = _editing || forceEditMode;
    const [inProgress, setInProgress] = React.useState(false);

    React.useEffect(() => {
        if (ddah != null) {
            setDuties(receivedDuties);
        }
    }, [ddah, receivedDuties]);

    function onHide() {
        setEditing(false);
        setDuties(receivedDuties);
        _onHide();
    }

    function onDutyChange(category: DutyCategory, newDuty: Duty) {
        const newDuties = duties.map((duty) => {
            if (duty.order !== newDuty.order) {
                return duty;
            }
            newDuty = {
                ...newDuty,
                description: `${category}:${newDuty.description}`,
            };
            return { ...duty, ...newDuty };
        });
        setDuties(newDuties);
    }
    function onDutyAdd(category: DutyCategory) {
        const maxOrder = Math.max(...duties.map((duty) => duty.order));
        const order = Number.isFinite(maxOrder) ? maxOrder + 1 : -1;
        setDuties([
            ...duties,
            { order, hours: 0, description: `${category}:` },
        ]);
    }
    function onDutyDelete(duty: Duty) {
        setDuties(duties.filter((d) => d.order !== duty.order));
    }

    if (ddah != null) {
        let totalHours = 0;
        for (const duty of duties) {
            totalHours += duty.hours;
        }
        const hoursMismatch = ddah.assignment
            ? ddah.assignment.hours !== totalHours
            : false;
        const dutiesByCategory: Record<DutyCategory, Duty[]> = {
            note: [],
            prep: [],
            training: [],
            meeting: [],
            contact: [],
            marking: [],
            other: [],
        };
        for (const duty of duties) {
            const { category, description } = splitDutyDescription(
                duty.description
            ) as { category: DutyCategory; description: string };
            dutiesByCategory[category] = dutiesByCategory[category] || [];
            dutiesByCategory[category].push({ ...duty, description });
        }

        const assignment = ddah.assignment;
        const applicant = assignment.applicant;
        const position = assignment.position;

        ddahPreview = (
            <Box className="instructor-ddah-preview-container">
                <Table size="small" sx={{ mb: 2, width: "auto" }}>
                    <TableBody>
                        <TableRow>
                            <TableCell component="th" scope="row" sx={{ fontWeight: "bold" }}>
                                TA:
                            </TableCell>
                            <TableCell>
                                {applicant.first_name} {applicant.last_name}
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell component="th" scope="row" sx={{ fontWeight: "bold" }}>
                                Position:
                            </TableCell>
                            <TableCell>
                                {position.position_code} ({position.position_title})
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>

                <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                    Notes
                </Typography>
                {editing && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                        {categoryInformation["note"].helpText}
                    </Alert>
                )}
                <List dense>
                    <DutyList
                        category="note"
                        duties={dutiesByCategory["note"] || []}
                        showEmptyDutyString={false}
                        onChange={onDutyChange}
                        onDelete={onDutyDelete}
                        onNew={onDutyAdd}
                        editable={editing}
                    />
                </List>

                <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                    Duties
                </Typography>
                {(
                    [
                        "meeting",
                        "prep",
                        "contact",
                        "marking",
                        "training",
                        "other",
                    ] as DutyCategory[]
                ).map((category) => (
                    <Box key={category} sx={{ mb: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                            {categoryInformation[category].title}
                        </Typography>
                        {editing && categoryInformation[category].helpText && (
                            <Alert severity="info" sx={{ mb: 1 }}>
                                <span
                                    dangerouslySetInnerHTML={{
                                        __html: categoryInformation[category].helpText,
                                    }}
                                />
                            </Alert>
                        )}
                        <List dense>
                            <DutyList
                                category={category}
                                duties={dutiesByCategory[category] || []}
                                onChange={onDutyChange}
                                onDelete={onDutyDelete}
                                onNew={onDutyAdd}
                                editable={editing}
                            />
                        </List>
                    </Box>
                ))}

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <Typography
                        component="span"
                        variant="body2"
                        color={hoursMismatch ? "error" : "text.primary"}
                        sx={{ fontWeight: hoursMismatch ? "bold" : "normal", mr: 0.7 }}
                    >
                        {totalHours}
                    </Typography>
                    <Typography component="span" variant="body2" sx={{ mr: 1 }}>
                        of {ddah.assignment ? ddah.assignment.hours : "?"} hours allocated
                    </Typography>
                    {hoursMismatch && (
                        <Typography component="span" variant="body2" color="error">
                            ({(ddah.assignment?.hours || 0) - totalHours} unassigned)
                        </Typography>
                    )}
                </Box>

                <Box className="signature-area" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                        Prepared
                        {ddah.emailed_date ? ` on ${formatDate(ddah.emailed_date)}` : ""}
                    </Typography>
                    <Typography variant="body2">
                        {ddah.accepted_date
                            ? `Acknowledged by ${applicant.first_name} ${applicant.last_name} on ${formatDate(ddah.accepted_date)}`
                            : "Not yet acknowledged"}
                    </Typography>
                </Box>
            </Box>
        );
        url = `/public/ddahs/${ddah.url_token}.pdf`;
    }

    const spinner = inProgress ? (
        <CircularProgress size={20} sx={{ mr: 1 }} />
    ) : null;

    let footer = (
        <>
            <Button variant="contained" color="secondary" onClick={() => onHide()}>
                Close
            </Button>
            <Button variant="contained" color="info" onClick={() => setEditing(true)} startIcon={<Edit />}>
                Edit
            </Button>
            {url && (
                <Button
                    title="Download DDAH."
                    variant="contained"
                    color="primary"
                    href={formatDownloadUrl(url)}
                    startIcon={<Download />}
                >
                    Download PDF
                </Button>
            )}
        </>
    );
    if (editing) {
        footer = (
            <>
                <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => {
                        setDuties(receivedDuties);
                        setEditing(false);
                        if (forceEditMode) {
                            onHide();
                        }
                    }}
                >
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    color="info"
                    onClick={async () => {
                        setInProgress(true);
                        await onEdit({ ...ddah, duties });
                        setInProgress(false);
                        setEditing(false);
                    }}
                    startIcon={spinner || <Save />}
                >
                    Save
                </Button>
            </>
        );
    }

    return (
        <Dialog open={show} onClose={onHide} maxWidth="md" fullWidth>
            <DialogTitle sx={{ m: 0, p: 2 }}>
                Description of Duties and Allocation of Hours
                <IconButton
                    aria-label="close"
                    onClick={onHide}
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        color: (theme) => theme.palette.grey[500],
                    }}
                    size="large"
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers>
                {ddahPreview}
            </DialogContent>
            <DialogActions>
                {footer}
            </DialogActions>
        </Dialog>
    );
}