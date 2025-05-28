import React from "react";
import { useSelector } from "react-redux";
import {
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
    ListItemText,
    Tooltip,
    Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import EditIcon from "@mui/icons-material/Edit";
import SearchIcon from "@mui/icons-material/Search";

import { ddahTableSelector, setSelectedRows } from "./actions";
import { Ddah, Assignment, Instructor } from "../../../api/defs/types";
import {
    ddahsSelector,
    upsertDdah,
    approveDdah,
} from "../../../api/actions/ddahs";
import { assignmentsSelector } from "../../../api/actions";
import { formatDate, formatDownloadUrl } from "../../../libs/utils";
import { DdahEditor } from "../../../components/ddahs";
import { AdvancedFilterTable, AdvancedColumnDef } from "../../../components/advanced-filter-table";
import { useThunkDispatch } from "../../../libs/thunk-dispatch";
import {
    ddahIssues,
    getReadableStatus,
    getRecentActivityDate,
    splitDutyDescription,
} from "./../../../libs/ddah-utils";
import { DutyCategory } from "../../../components/ddahs";

import "./styles.css";

export interface RowData {
    id?: number;
    position_code: string;
    last_name: string;
    first_name: string;
    total_hours: number | null;
    status: string | null;
    recent_activity_date: string | null;
    emailed_date: string | null;
    issues: string | null;
    issue_code: "hours_mismatch" | "missing" | null;
}

/**
 * Cell for rendering the status of a DDAH
 *
 * @param {{ original: RowData }} { original }
 * @returns {React.ReactNode}
 */
export function StatusCell({
    row,
    children = null,
}: {
    row: { original: RowData };
    children?: React.ReactNode;
}): React.JSX.Element {
    const original = row.original;
    // If the row represents an assignment with a missing DDAH, we don't want to show a status
    if (String(original.id).startsWith("assignment-")) {
        return null as any;
    }
    const readableStatus = getReadableStatus(original as Pick<Ddah, "status">);
    switch ((original as Pick<Ddah, "status">).status) {
        case "accepted":
            return (
                <React.Fragment>
                    {children}
                    <Typography color="success">
                        {readableStatus}
                    </Typography>
                </React.Fragment>
            );
        default:
            return (
                <React.Fragment>
                    {children}
                    {readableStatus}
                </React.Fragment>
            );
    }
}

/**
 * Cell for rendering the issues of a DDAH
 *
 * @param {{ original: RowData }} { original }
 * @returns {React.ReactNode}
 */
function IssuesCell({
    row,
}: {
    row: { original: RowData };
}): React.JSX.Element | null {
    const original = row.original;
    switch (original.issue_code) {
        case "hours_mismatch":
            return (
                <Typography variant="body2" color="error">
                    {original.issues}
                </Typography>
            );
        case "missing":
            return (
                <Typography variant="body2" color="textSecondary">
                    {original.issues}
                </Typography>
            );
        default:
            return null;
    }
}

/**
 * Cell for previewing a DDAH
 *
 * @param {{ original: RowData }} { original }
 * @returns {React.ReactNode}
 */
export function PreviewCell({
    row,
    onClick = () => {},
}: {
    row: { original: RowData };
    onClick: Function;
}): React.JSX.Element | null {
    const original = row.original;
    if (original.id == null) {
        return null;
    }
    return (
        <Tooltip title="Preview DDAH">
            <IconButton
                size="small"
                onClick={() => onClick(original.id)}
                sx={{ mr: 1, py: 0 }}
            >
                <SearchIcon fontSize="small" />
            </IconButton>
        </Tooltip>
    );
}

export function DdahPreviewModal({
    ddah,
    show,
    onHide = () => {},
    onApprove = () => {},
    onEdit = () => {},
}: {
    ddah: Ddah | null;
    show: boolean;
    onHide?: (...params: any[]) => void;
    onApprove?: Function;
    onEdit?: Function;
}): React.ReactElement {
    let ddahPreview: React.ReactElement | string = "No DDAH to preview";
    let url: string | null = null;
    if (ddah != null) {
        ddahPreview = <DdahPreview ddah={ddah} />;
        url = `/public/ddahs/${ddah.url_token}.pdf`;
    }
    return (
        <Dialog open={show} onClose={onHide} maxWidth="lg" fullWidth>
            <DialogTitle sx={{ m: 0, p: 2 }}>
                Previewing DDAH
                <IconButton
                    aria-label="close"
                    onClick={onHide}
                    sx={{
                        position: "absolute",
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
                <Button variant="contained" color="secondary" onClick={() => onHide()}>
                    Close
                </Button>
                <Button
                    variant="contained"
                    color="info"
                    onClick={() => onEdit(ddah)}
                    startIcon={<EditIcon sx={{ mr: 1 }} />}
                >
                    Edit
                </Button>
                {url && (
                    <Button
                        title="Download DDAH."
                        variant="contained"
                        href={formatDownloadUrl(url)}
                        target="_blank"
                        rel="noopener"
                        startIcon={<DownloadIcon sx={{ mr: 1 }} />}
                    >
                        Download DDAH
                    </Button>
                )}
                <Button
                    onClick={() => onApprove(ddah)}
                    variant="contained"
                    color="success"
                    startIcon={<CheckIcon sx={{ mr: 1 }} />}
                >
                    Approve
                </Button>
            </DialogActions>
        </Dialog>
    );
}

function DdahPreview({ ddah }: { ddah: Ddah }): React.ReactElement {
    const duties = [...ddah.duties];
    duties.sort((a, b) => a.order - b.order);

    const assignment = ddah.assignment;
    const applicant = assignment.applicant;
    const position = assignment.position;
    const instructors = position.instructors;

    const theme = useTheme();
    const categoryMap: Record<DutyCategory, { label: string; color: string }> = {
        note:     { label: "Note",             color: theme.palette.text.secondary },
        prep:     { label: "Preparation",      color: theme.palette.secondary.main },
        training: { label: "Training",         color: theme.palette.secondary.dark },
        meeting:  { label: "Meetings",         color: theme.palette.warning.main },
        contact:  { label: "Contact time",     color: theme.palette.success.main },
        marking:  { label: "Marking/Grading",  color: theme.palette.primary.main },
        other:    { label: "Other duties",     color: theme.palette.info.main },
    };

    return (
        <Box className="ddah-preview-container">
            <Typography variant="h4" gutterBottom>
                Description of Duties and Allocation of Hours
            </Typography>
            <Typography variant="subtitle2" gutterBottom>
                Position: {position.position_code} ({position.position_title})
            </Typography>
            <Typography variant="subtitle2" gutterBottom>
                TA: {applicant.first_name} {applicant.last_name}
            </Typography>
            <Typography variant="h5" sx={{ mt: 2 }}>
                Duties
            </Typography>
            <List dense>
                {duties.map((duty) => {
                    const { category, description } = splitDutyDescription(duty.description);
                    const cat = categoryMap[category as DutyCategory] || {
                        label: category,
                        color: theme.palette.text.primary,
                    }
                    return (
                        <ListItem key={duty.order} disableGutters>
                            <ListItemText
                                primary={
                                    <Box sx={{ display: "flex", alignItems: "center" }}>
                                        <Typography
                                            variant="body2"
                                            sx={{ minWidth: 40, fontWeight: category === "note" ? "normal" : "bold" }}
                                        >
                                            {category === "note" ? null : duty.hours}
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                ml: 2,
                                                width: "8em",
                                                display: "inline-block",
                                                color: cat.color,
                                            }}
                                        >
                                            {cat.label}
                                        </Typography>
                                        <Typography variant="body2" sx={{ ml: 2 }}>
                                            {description}
                                        </Typography>
                                    </Box>
                                }
                            />
                        </ListItem>
                    );
                })}
                <Divider />
                <ListItem disableGutters>
                    <ListItemText
                        primary={
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                                <Typography variant="body2" sx={{ minWidth: 40, fontWeight: "bold" }}>
                                    {ddah.total_hours}
                                </Typography>
                                <Typography variant="body2" sx={{ ml: 2, fontStyle: "italic" }}>
                                    Total
                                </Typography>
                            </Box>
                        }
                    />
                </ListItem>
            </List>
            <Box className="signature-area">
                <Typography variant="body2">
                    Prepared by {getFormattedInstructorNameList(instructors)}
                    {ddah.emailed_date ? ` on ${formatDate(ddah.emailed_date)}` : ""}
                </Typography>
                <Typography variant="body2">
                    {ddah.accepted_date
                        ? `Accepted by ${applicant.first_name} ${applicant.last_name} on ${formatDate(ddah.accepted_date)}`
                        : "Not yet accepted"}
                </Typography>
            </Box>
        </Box>
    );
}

export function ConnectedDdahEditorModal({
    ddah,
    show,
    onHide = () => {},
}: {
    ddah: Ddah | null;
    show: boolean;
    onHide?: (...params: any[]) => void;
}): React.ReactElement {
    const [inProgress, setInProgress] = React.useState(false);
    const dispatch = useThunkDispatch();
    const [newDdah, setNewDdah] = React.useState<Ddah | null>(ddah);

    React.useEffect(() => {
        setNewDdah(ddah);
    }, [ddah]);

    // When a confirm operation is in progress, a spinner is displayed; otherwise
    // it's hidden
    const spinner = inProgress ? (
        <CircularProgress size={18} sx={{ mr: 1 }} />
    ) : null;

    async function onSave(newDdah: Ddah | null) {
        try {
            if (newDdah) {
                setInProgress(true);
                await dispatch(upsertDdah(newDdah));
            }
        } finally {
            setInProgress(false);
            onHide();
        }
    }

    const editor = ddah ? (
        <DdahEditor
            ddah={newDdah as Ddah}
            editableAssignment={false}
            setDdah={setNewDdah}
        />
    ) : (
        "No DDAH Specified"
    );

    return (
        <Dialog open={show} onClose={onHide} maxWidth="lg" fullWidth>
            <DialogTitle sx={{ m: 0, p: 2 }}>
                Editing DDAH
                <IconButton
                    aria-label="close"
                    onClick={onHide}
                    sx={{
                        position: "absolute",
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
                {editor}
            </DialogContent>
            <DialogActions>
                <Button variant="contained" color="secondary" onClick={onHide}>
                    Cancel
                </Button>
                <Button
                    onClick={() => onSave(newDdah)}
                    variant="contained"
                    color="primary"
                    startIcon={spinner}
                >
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
}

/**
 * Return a formatted list of instructors, or `"(Unknown)"` if there are none listed.
 */
function getFormattedInstructorNameList(instructors: Instructor[]): string {
    if (instructors.length === 0) {
        return "(Unknown)";
    }
    const names = instructors.map(
        (instructor) => `${instructor.first_name} ${instructor.last_name}`
    );
    try {
        const formatter = new (Intl as any).ListFormat("en", {
            style: "long",
            type: "conjunction",
        });
        return formatter.format(names);
    } catch (e) {
        return names.join(", ");
    }
}

/**
 * Table to view/preview large collections of DDAHs
 *
 * @export
 * @returns
 */
export function ConnectedDdahsTable() {
    let ddahs = useSelector(ddahsSelector) as Ddah[];
    const assignments = useSelector(assignmentsSelector) as Assignment[];
    const selected = useSelector(ddahTableSelector).selectedDdahIds;
    const dispatch = useThunkDispatch();

    const [previewVisible, setPreviewVisible] = React.useState<boolean>(false);
    const [editVisible, setEditVisible] = React.useState<boolean>(false);
    const [previewDdah, setPreviewDdah] = React.useState<Ddah | null>(null);

    const setSelected = React.useCallback(
        (ids: number[]) => {
            // Filter out null/undefined and only dispatch if changed
            const filtered = ids.filter((id) => id != null);
            if (
                filtered.length !== selected.length ||
                filtered.some((id, i) => id !== selected[i])
            ) {
                dispatch(setSelectedRows(filtered));
            }
        },
        [dispatch, selected]
    );

    const onPreviewClick = React.useCallback((id: number) => {
        setPreviewDdah(ddahs.find((ddah) => ddah.id === id) || null);
        setPreviewVisible(true);
    }, [ddahs]);

    const WrappedStatusCell = React.useCallback((props: any): React.ReactNode => {
        const { row, ...rest } = props;
        return (
            <StatusCell row={row} {...rest}>
                <PreviewCell {...props} onClick={onPreviewClick} />
            </StatusCell>
        );
    }, [onPreviewClick]);

    const data = React.useMemo(() => {
        // The omni-search doesn't work on nested properties, so we need to flatten
        // the data we display before sending it to the table.
        const rows: RowData[] = ddahs.map(
            (ddah) =>
                ({
                    id: ddah.id,
                    position_code: ddah.assignment.position.position_code,
                    last_name: ddah.assignment.applicant.last_name,
                    first_name: ddah.assignment.applicant.first_name,
                    total_hours: ddah.total_hours,
                    status: ddah.status || "unsent",
                    recent_activity_date: getRecentActivityDate(ddah),
                    emailed_date: formatDate(ddah.emailed_date || ""),
                    approved: ddah.approved_date ? "Approved" : "",
                    readable_status: getReadableStatus(ddah),
                    issues: ddahIssues(ddah),
                    issue_code: ddahIssues(ddah) ? "hours_mismatch" : null,
                } as RowData)
        );

        // Hash existing DDAHs by assignment id
        const ddahAssignmentIdsHash: { [key: string]: true } = {};
        for (const ddah of ddahs) {
            ddahAssignmentIdsHash[ddah.assignment.id] = true;
        }
        // Add missing DDAHs
        for (const assignment of assignments) {
            if (
                assignment.active_offer_status === "rejected" ||
                assignment.active_offer_status === "withdrawn"
            ) {
                continue;
            }
            if (ddahAssignmentIdsHash[assignment.id]) {
                continue;
            }
            rows.push({
                position_code: assignment.position.position_code,
                last_name: assignment.applicant.last_name || "",
                first_name: assignment.applicant.first_name,
                total_hours: null,
                status: null,
                recent_activity_date: null,
                emailed_date: null,
                issues: "Missing DDAH",
                issue_code: "missing",
            });
        }
        // Sort the table by position_code by default
        rows.sort((a, b) => {
            if (a.position_code > b.position_code) return 1;
            if (a.position_code < b.position_code) return -1;
            if (a.last_name > b.last_name) return 1;
            if (a.last_name < b.last_name) return -1;
            return 0;
        });
        return rows;
    }, [ddahs, assignments]);

    const columns: AdvancedColumnDef<RowData>[] = React.useMemo(() => [
        {
            header: "Position",
            accessorKey: "position_code",
        },
        { 
            header: "Last Name",
            accessorKey: "last_name"
        },
        { 
            header: "First Name",
            accessorKey: "first_name"
        },
        {
            header: "DDAH Hours",
            accessorKey: "total_hours",
            maxSize: 150,
        },
        {
            header: "Status",
            accessorKey: "status",
            Cell: WrappedStatusCell,
        },
        {
            header: "Recent Activity",
            accessorKey: "recent_activity_date",
        },
        {
            header: "Emailed",
            accessorKey: "emailed_date",
        },
        {
            header: "Approved",
            accessorKey: "approved",
            maxSize: 120,
            Cell: ({ cell }) => {
                const value = cell.getValue();
                return value ? (
                    <Typography color="success">
                        <CheckIcon />
                    </Typography>
                ) : null;
            }
        },
        {
            header: "Issues",
            accessorKey: "issues",
            Cell: IssuesCell,
        },
    ], [WrappedStatusCell]);

    return (
        <>
            <ConnectedDdahEditorModal
                ddah={previewDdah}
                show={editVisible}
                onHide={() => setEditVisible(false)}
            />
            <DdahPreviewModal
                ddah={previewDdah}
                show={previewVisible}
                onHide={() => setPreviewVisible(false)}
                onEdit={() => {
                    setPreviewVisible(false);
                    setEditVisible(true);
                }}
                onApprove={async () => {
                    if (previewDdah) {
                        await dispatch(approveDdah(previewDdah));
                    }
                    setPreviewVisible(false);
                }}
            />
            <AdvancedFilterTable
                columns={columns}
                data={data}
                selectable={true}
                selected={selected}
                setSelected={setSelected}
                isRowSelectable={(row) => typeof row.id === "number"}
                filterable={true}
            />
        </>
    );
}
