import React from "react";
import { useSelector } from "react-redux";
import {
    Alert,
    Button,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import SavedSearchIcon from "@mui/icons-material/SavedSearch";

import { offerTableSelector } from "../offertable/actions";
import {
    assignmentsSelector,
    fetchOfferHistoryForAssignment,
    fetchWageChunksForAssignment,
} from "../../../api/actions";
import { Offer, WageChunk } from "../../../api/defs/types";
import {
    capitalize,
    formatDate,
    formatDateTime,
    formatDownloadUrl,
    getStatusColor,
} from "../../../libs/utils";
import { ActionButton } from "../../../components/action-buttons";
import { useThunkDispatch } from "../../../libs/thunk-dispatch";

function OfferHistoryDetails({ offers }: { offers: Offer[] }) {
    const theme = useTheme();
    if (offers.length === 0) {
        return <Typography variant="body2">No Offer</Typography>;
    }
    return (
        <Table className="offer-history-details-table" size="small" sx={{ minWidth: 650 }}>
            <TableHead>
                <TableRow>
                    <TableCell />
                    <TableCell>Status</TableCell>
                    <TableCell>Hours</TableCell>
                    <TableCell>Emailed Date</TableCell>
                    <TableCell>Accepted Date</TableCell>
                    <TableCell>Rejected Date</TableCell>
                    <TableCell>Withdrawn Date</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {(offers || []).map((offer, i) => {
                    const url = `/external/contracts/${offer.url_token}.pdf`;
                    return (
                        <TableRow key={i}>
                            <TableCell>
                                <Button
                                    href={formatDownloadUrl(url)}
                                    variant="outlined"
                                    size="small"
                                    sx={{ minWidth: 0, p: 0.5 }}
                                    title="Download offer PDF"
                                    target="_blank"
                                    rel="noopener"
                                >
                                    <SearchIcon />
                                </Button>
                            </TableCell>
                            <TableCell>
                                <Typography variant="body2" color={getStatusColor(offer.status, theme)}>
                                    {capitalize(offer.status)}
                                </Typography>
                            </TableCell>
                            <TableCell className="number">{offer.hours}</TableCell>
                            <TableCell
                                title={formatDateTime(offer.emailed_date || undefined)}
                            >
                                {formatDate(offer.emailed_date || "")}
                            </TableCell>
                            <TableCell
                                title={formatDateTime(offer.accepted_date || undefined)}
                            >
                                {formatDate(offer.accepted_date || "")}
                            </TableCell>
                            <TableCell
                                title={formatDateTime(offer.rejected_date || undefined)}
                            >
                                {formatDate(offer.rejected_date || "")}
                            </TableCell>
                            <TableCell
                                title={formatDateTime(offer.withdrawn_date || undefined)}
                            >
                                {formatDate(offer.withdrawn_date || "")}
                            </TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
}

function WagechunkDetails({ wageChunks }: { wageChunks: WageChunk[] }) {
    if (!wageChunks || wageChunks.length === 0) {
        return <Typography variant="body2">No Wage Chunks</Typography>;
    }
    return (
        <Table className="wagechunk-details-table" size="small" sx={{ minWidth: 400 }}>
            <TableHead>
                <TableRow>
                    <TableCell>Hours</TableCell>
                    <TableCell>Rate</TableCell>
                    <TableCell>Start Date</TableCell>
                    <TableCell>End Date</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {wageChunks.map((chunk, i) => (
                    <TableRow key={i}>
                        <TableCell>{chunk.hours}</TableCell>
                        <TableCell>{chunk.rate}</TableCell>
                        <TableCell>{formatDate(chunk.start_date || "")}</TableCell>
                        <TableCell>{formatDate(chunk.end_date || "")}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

export function ConnectedAssignmentDetails({
    assignmentId,
}: {
    assignmentId: number;
}) {
    const assignments = useSelector(assignmentsSelector);
    const assignment = assignments.find((a) => a.id === assignmentId);
    const assignmentNotFound = !assignment;
    const wageChunksNotFound = !assignment?.wage_chunks;
    const dispatch = useThunkDispatch();
    const theme = useTheme();

    React.useEffect(() => {
        if (assignmentNotFound) {
            return;
        }
        // If the assignment already has wage chunks, we don't need to refetch them.
        if (wageChunksNotFound) {
            dispatch(fetchWageChunksForAssignment({ id: assignmentId }));
        }

        // Always fetch the offer history, since details of the offers
        // may have changed without the assignment changing.
        dispatch(fetchOfferHistoryForAssignment({ id: assignmentId }));
    }, [assignmentId, dispatch, assignmentNotFound, wageChunksNotFound]);

    if (!assignment) {
        return <Typography>No Assignment found with ID &quot;{assignmentId}&quot;</Typography>;
    }

    return (
        <Table className="assignment-details-table" size="small">
            <TableBody>
                <TableRow>
                    <TableCell component="th" scope="row">Position</TableCell>
                    <TableCell>
                        {assignment.position.position_code}{" "}
                        {assignment.position.position_title}
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell component="th" scope="row">Applicant Name</TableCell>
                    <TableCell>
                        {assignment.applicant.last_name},{" "}
                        {assignment.applicant.first_name}
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell component="th" scope="row">Student Number</TableCell>
                    <TableCell>{assignment.applicant.student_number}</TableCell>
                </TableRow>
                <TableRow>
                    <TableCell component="th" scope="row">Total Hours</TableCell>
                    <TableCell>{assignment.hours}</TableCell>
                </TableRow>
                <TableRow>
                    <TableCell component="th" scope="row">Offer Status</TableCell>
                    <TableCell>
                        <Typography variant="body2" color={getStatusColor(assignment.active_offer_status, theme)}>
                            {capitalize(assignment.active_offer_status || "No Offer")}
                        </Typography>
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell component="th" scope="row">Pay Description</TableCell>
                    <TableCell>
                        {assignment.wage_chunks ? (
                            <WagechunkDetails wageChunks={assignment.wage_chunks} />
                        ) : (
                            <CircularProgress size={20} sx={{ mr: 1 }} />
                        )}
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell component="th" scope="row">Offer History</TableCell>
                    <TableCell>
                        {assignment.offers ? (
                            <OfferHistoryDetails offers={assignment.offers} />
                        ) : (
                            <CircularProgress size={20} sx={{ mr: 1 }} />
                        )}
                    </TableCell>
                </TableRow>
            </TableBody>
        </Table>
    );
}

export function ConnectedViewAssignmentDetailsAction() {
    const assignments = useSelector(assignmentsSelector);
    const { selectedAssignmentIds } = useSelector<
        any,
        { selectedAssignmentIds: number[] }
    >(offerTableSelector);
    const selectedAssignments = assignments.filter((assignment) =>
        selectedAssignmentIds.includes(assignment.id)
    );
    const [dialogVisible, setDialogVisible] = React.useState<boolean>(false);

    // We want to show the assignment details in a predictable order, so sort
    // by position code and then last, first
    selectedAssignments.sort((a, b) => {
        const aHash = `${a.position.position_code} ${a.applicant.last_name} ${a.applicant.first_name}`;
        const bHash = `${b.position.position_code} ${b.applicant.last_name} ${b.applicant.first_name}`;
        return aHash === bHash ? 0 : aHash > bHash ? 1 : -1;
    });

    let assignmentDetails: React.ReactNode = (
        <Alert severity="info">
            There are no selected assignments. You must select assignments to
            see their details.
        </Alert>
    );
    if (selectedAssignments.length > 0) {
        assignmentDetails = selectedAssignments.map((assignment, i) => {
            const split = i === 0 ? null : <hr />;
            return (
                <React.Fragment key={i}>
                    {split}
                    <ConnectedAssignmentDetails
                        assignmentId={assignment.id}
                        key={i}
                    />
                </React.Fragment>
            );
        });
    }

    const disabled = selectedAssignmentIds.length === 0;

    return (
        <React.Fragment>
            <ActionButton
                icon={<SavedSearchIcon />}
                onClick={() => setDialogVisible(true)}
                title={
                    disabled
                        ? "You must select an assignment to view its details"
                        : "View details of selected assignment(s)"
                }
                disabled={disabled}
            >
                Assignment Details
            </ActionButton>
            <Dialog
                open={dialogVisible}
                onClose={() => setDialogVisible(false)}
                maxWidth="xl"
                fullWidth
            >
                <DialogTitle sx={{ m: 0, p: 2 }}>
                    Assignment Details
                    <IconButton
                        aria-label="close"
                        onClick={() => setDialogVisible(false)}
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
                    {assignmentDetails}
                </DialogContent>
                <DialogActions>
                    <Button
                        variant="contained"
                        color="secondary"
                        onClick={() => setDialogVisible(false)}
                    >
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </React.Fragment>
    );
}
