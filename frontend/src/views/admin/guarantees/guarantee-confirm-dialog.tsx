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
    IconButton,
    Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import { AdvancedColumnDef, AdvancedFilterTable } from "../../../components/advanced-filter-table";
import { ApplicantMatchingDatum } from "../../../api/defs/types";
import { compareString } from "../../../libs/utils";

const applicantMatchingDatumModalColumn: AdvancedColumnDef<ApplicantMatchingDatum>[] = [
    {
        header: "Last Name",
        accessorKey: "applicant.last_name",
        maxSize: 120,
    },
    {
        header: "First Name",
        accessorKey: "applicant.first_name",
        maxSize: 120,
    },
    {
        header: "Minimum Hours Owed",
        accessorKey: "min_hours_owed",
        meta: {
            className: "number-cell",
        },
        maxSize: 70,
    },
    {
        header: "Maximum Hours Owed",
        accessorKey: "max_hours_owed",
        meta: {
            className: "number-cell",
        },
        maxSize: 70,
    },
    {
        header: "Hours Previously Fulfilled",
        accessorKey: "prev_hours_fulfilled",
        meta: {
            className: "number-cell",
        },
        maxSize: 70,
    },
    {
        header: "Status",
        maxSize: 100,
        id: "status",
        // We want items with no active confirmation to appear at the end of the list
        // when sorted, so we set their accessor to null (the accessor is used by react table
        // when sorting items).
        accessorFn: (dat: any) =>
            dat.active_confirmation_status === "No Letter Sent"
                ? null
                : dat.active_confirmation_status,
    },
];

function compareAppointment(a1: ApplicantMatchingDatum, a2: ApplicantMatchingDatum) {
    return (
        compareString(a1.applicant.last_name || "", a2.applicant.last_name || "") ||
        compareString(a1.applicant.first_name, a2.applicant.first_name)
    );
}

export function GuaranteeConfirmDialog(props: {
    data: ApplicantMatchingDatum[];
    visible: boolean;
    setVisible: Function;
    callback: Function;
    title: string;
    body: string;
    confirm: string;
}) {
    const { data, visible, setVisible, callback, title, body, confirm } =
        props;

    const [inProgress, setInProgress] = React.useState(false);

    async function executeCallback() {
        setInProgress(true);
        await callback();
        setInProgress(false);
        setVisible(false);
    }

    // We want to minimize the re-render of the table. Since some bindings for columns
    // are generated on-the-fly, memoize the result so we don't trigger unneeded re-renders.
    data.sort(compareAppointment);

    return (
        <Dialog
            open={visible}
            onClose={() => setVisible(false)}
            maxWidth="lg"
            fullWidth
        >
            <DialogTitle sx={{ m: 0, p: 2 }}>
                {title}
                <IconButton
                    aria-label="close"
                    onClick={() => setVisible(false)}
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
                <Alert severity="info" sx={{ mb: 3 }}>
                    <Typography variant="body1">{body}</Typography>
                </Alert>
                <Box sx={{ mb: 3 }}>
                    <AdvancedFilterTable
                        filterable={false}
                        columns={applicantMatchingDatumModalColumn}
                        data={data}
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={() => setVisible(false)}
                    variant="contained"
                    color="secondary"
                >
                    Cancel
                </Button>
                <Button
                    onClick={executeCallback}
                    variant="contained"
                    color="primary"
                    disabled={inProgress}
                    startIcon={inProgress ? <CircularProgress size={18} sx={{ mr: 1 }} /> : null}
                >
                    {confirm}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
