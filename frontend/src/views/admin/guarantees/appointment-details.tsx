import React from "react";
import { useSelector } from "react-redux";
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Tooltip,
    Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import SavedSearchIcon from "@mui/icons-material/SavedSearch";

import { guaranteeTableSelector } from "./actions";
import {
    applicantMatchingDataSelector,
    fetchConfirmationHistoryForApplicantMatchingDatum,
} from "../../../api/actions";
import { Confirmation } from "../../../api/defs/types";
import {
    capitalize,
    formatDate,
    formatDateTime,
    formatDownloadUrl,
} from "../../../libs/utils";
import { ActionButton } from "../../../components/action-buttons";
import { useThunkDispatch } from "../../../libs/thunk-dispatch";
import { getStatusColor } from "../../../libs/utils";

function ConfirmationHistoryDetails({ confirmations }: { confirmations: Confirmation[] }) {
    const theme = useTheme();
    if (confirmations.length === 0) {
        return (
            <Typography variant="body2" color="textSecondary">
                No Letter Sent
            </Typography>
        );
    }
    return (
        <Table className="confirmation-history-details-table" size="small" sx={{ minWidth: 650 }}>
            <TableHead>
                <TableRow>
                    <TableCell />
                    <TableCell>Status</TableCell>
                    <TableCell>Min Hours Owed</TableCell>
                    <TableCell>Max Hours Owed</TableCell>
                    <TableCell>Hours Previously Fulfilled</TableCell>
                    <TableCell>Emailed Date</TableCell>
                    <TableCell>Accepted Date</TableCell>
                    <TableCell>Rejected Date</TableCell>
                    <TableCell>Withdrawn Date</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {(confirmations || []).map((confirmation, i) => {
                    const url = `/external/letters/${confirmation.url_token}.pdf`;
                    return (
                        <TableRow key={i}>
                            <TableCell>
                                <Button
                                    href={formatDownloadUrl(url)}
                                    variant="outlined"
                                    size="small"
                                    sx={{ py: 0, minWidth: 0 }}
                                    title="Download letter PDF"
                                >
                                    <SearchIcon fontSize="small" />
                                </Button>
                            </TableCell>
                            <TableCell>
                                <Typography
                                    variant="body2"
                                    sx={{
                                        color: getStatusColor(confirmation.status, theme),
                                        fontWeight: 500,
                                    }}
                                >
                                    {capitalize(confirmation.status)}
                                </Typography>
                            </TableCell>
                            <TableCell>{confirmation.min_hours_owed}</TableCell>
                            <TableCell>{confirmation.max_hours_owed}</TableCell>
                            <TableCell>{confirmation.prev_hours_fulfilled}</TableCell>
                            <TableCell>
                                <Tooltip title={formatDateTime(confirmation.emailed_date || undefined)}>
                                    <span>{formatDate(confirmation.emailed_date || "")}</span>
                                </Tooltip>
                            </TableCell>
                            <TableCell>
                                <Tooltip title={formatDateTime(confirmation.accepted_date || undefined)}>
                                    <span>{formatDate(confirmation.accepted_date || "")}</span>
                                </Tooltip>
                            </TableCell>
                            <TableCell>
                                <Tooltip title={formatDateTime(confirmation.rejected_date || undefined)}>
                                    <span>{formatDate(confirmation.rejected_date || "")}</span>
                                </Tooltip>
                            </TableCell>
                            <TableCell>
                                <Tooltip title={formatDateTime(confirmation.withdrawn_date || undefined)}>
                                    <span>{formatDate(confirmation.withdrawn_date || "")}</span>
                                </Tooltip>
                            </TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
}

export function ConnectedApplicantMatchingDatumDetails({
    applicantMatchingDatumId,
}: {
    applicantMatchingDatumId: number;
}) {
    const applicantMatchingData = useSelector(applicantMatchingDataSelector);
    const applicantMatchingDatum = applicantMatchingData.find((a) => a.id === applicantMatchingDatumId);
    const applicantMatchingDatumNotFound = !applicantMatchingDatum;
    const dispatch = useThunkDispatch();

    React.useEffect(() => {
        if (applicantMatchingDatumNotFound) {
            return;
        }
        dispatch(fetchConfirmationHistoryForApplicantMatchingDatum({ id: applicantMatchingDatumId }));
    }, [applicantMatchingDatumId, dispatch, applicantMatchingDatumNotFound]);

    if (!applicantMatchingDatum) {
        return <Typography>No Appointment found with ID &quot;{applicantMatchingDatumId}&quot;</Typography>;
    }

    return (
        <Table size="small" className="appointment-details-table">
            <TableBody>
                <TableRow>
                    <TableCell variant="head">Applicant Name</TableCell>
                    <TableCell>
                        <Typography variant="body2">
                            {applicantMatchingDatum.applicant.last_name}, {applicantMatchingDatum.applicant.first_name}
                        </Typography>
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell variant="head">Student Number</TableCell>
                    <TableCell>
                        <Typography variant="body2">
                            {applicantMatchingDatum.applicant.student_number}
                        </Typography>
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell variant="head">Minimum Hours Owed</TableCell>
                    <TableCell>
                        <Typography variant="body2">
                            {applicantMatchingDatum.min_hours_owed}
                        </Typography>
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell variant="head">Maximum Hours Owed</TableCell>
                    <TableCell>
                        <Typography variant="body2">
                            {applicantMatchingDatum.max_hours_owed}
                        </Typography>
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell variant="head">Hours Previously Fulfilled</TableCell>
                    <TableCell>
                        <Typography variant="body2">
                            {applicantMatchingDatum.prev_hours_fulfilled}
                        </Typography>
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell variant="head">Appointment Confirmation Status</TableCell>
                    <TableCell>
                        <Typography
                            variant="body2"
                            className={`status ${applicantMatchingDatum.active_confirmation_status}`}
                        >
                            {capitalize(applicantMatchingDatum.active_confirmation_status || "No Letter Sent")}
                        </Typography>
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell variant="head" sx={{ verticalAlign: "top" }}>
                        Appointment Confirmation History
                    </TableCell>
                    <TableCell>
                        {applicantMatchingDatum.confirmations ? (
                            <ConfirmationHistoryDetails confirmations={applicantMatchingDatum.confirmations} />
                        ) : (
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                                <CircularProgress size={18} sx={{ mr: 1 }} />
                                <Typography variant="body2">Loading...</Typography>
                            </Box>
                        )}
                    </TableCell>
                </TableRow>
            </TableBody>
        </Table>
    );
}

export function ConnectedViewApplicantMatchingDatumDetailsAction() {
    const applicantMatchingData = useSelector(applicantMatchingDataSelector);
    const { selectedApplicantMatchingDatumIds } = useSelector<
        any,
        { selectedApplicantMatchingDatumIds: number[] }
    >(guaranteeTableSelector);
    const selectedApplicantMatchingData = applicantMatchingData.filter((applicantMatchingDatum) =>
        selectedApplicantMatchingDatumIds.includes(applicantMatchingDatum.id)
    );
    const [dialogVisible, setDialogVisible] = React.useState<boolean>(false);

    let applicantMatchingDatumDetails: React.ReactNode = (
        <Alert severity="info">
            There are no selected appointments. You must select appointment items to see their details.
        </Alert>
    );
    if (selectedApplicantMatchingData.length > 0) {
        applicantMatchingDatumDetails = selectedApplicantMatchingData.map((applicantMatchingDatum, i) => {
            const split = i === 0 ? null : <hr />;
            return (
                <React.Fragment key={i}>
                    {split}
                    <ConnectedApplicantMatchingDatumDetails
                        applicantMatchingDatumId={applicantMatchingDatum.id}
                        key={i}
                    />
                </React.Fragment>
            );
        });
    }

    const disabled = selectedApplicantMatchingDatumIds.length === 0;

    return (
        <React.Fragment>
            <ActionButton
                icon={<SavedSearchIcon />}
                onClick={() => setDialogVisible(true)}
                title={
                    disabled
                        ? "You must select an appointment to view its details"
                        : "View details of selected appointment(s)"
                }
                disabled={disabled}
            >
                Appointment Details
            </ActionButton>
            <Dialog
                open={dialogVisible}
                onClose={() => setDialogVisible(false)}
                maxWidth="xl"
                fullWidth
            >
                <DialogTitle sx={{ m: 0, p: 2 }}>
                    Appointment Details
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
                    {applicantMatchingDatumDetails}
                </DialogContent>
                <DialogActions>
                    <Button
                        variant="outlined"
                        onClick={() => setDialogVisible(false)}
                        color="secondary"
                    >
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </React.Fragment>
    );
}
