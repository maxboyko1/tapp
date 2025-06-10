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
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import { AdvancedFilterTable, AdvancedColumnDef } from "../../../components/advanced-filter-table";
import { Assignment } from "../../../api/defs/types";
import { compareString } from "../../../libs/utils";

const assignmentModalColumn: AdvancedColumnDef<Assignment>[] = [
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
        header: "Position",
        accessorKey: "position.position_code",
        size: 200,
    },
    {
        header: "Hours",
        accessorKey: "hours",
        maxSize: 70,
    },
    {
        header: "Status",
        maxSize: 100,
        id: "status",
        // We want items with no active offer to appear at the end of the list
        // when sorted, so we set their accessor to null (the accessor is used by react table
        // when sorting items).
        accessorFn: (data: any) =>
            data.active_offer_status === "No Contract"
                ? null
                : data.active_offer_status,
    },
];

function compareAssignment(a1: Assignment, a2: Assignment) {
    return (
        compareString(a1.position.position_code, a2.position.position_code) ||
        compareString(
            a1.applicant.last_name || "",
            a2.applicant.last_name || ""
        ) ||
        compareString(a1.applicant.first_name, a2.applicant.first_name)
    );
}

export function OfferConfirmationDialog(props: {
    data: Assignment[];
    visible: boolean;
    setVisible: (visible: boolean) => void;
    callback: () => Promise<any> | void;
    title: string;
    body: string;
    confirmation: string;
}) {
    const { data, visible, setVisible, callback, title, body, confirmation } =
        props;

    const [inProgress, setInProgress] = React.useState(false);

    async function executeCallback() {
        setInProgress(true);
        await callback();
        setInProgress(false);
        setVisible(false);
    }

    // When a confirm operation is in progress, a spinner is displayed; otherwise
    // it's hidden
    const spinner = inProgress ? (
        <CircularProgress size={20} sx={{ mr: 1 }} />
    ) : null;

    // We want to minimize the re-render of the table. Since some bindings for columns
    // are generated on-the-fly, memoize the result so we don't trigger unneeded re-renders.

    data.sort(compareAssignment);

    return (
        <Dialog open={visible} onClose={() => setVisible(false)} maxWidth="lg" fullWidth>
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
                <Box mb={3}>
                    <Alert severity="info">{body}</Alert>
                </Box>
                <Box mb={3}>
                    <AdvancedFilterTable
                        filterable={false}
                        columns={assignmentModalColumn}
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
                >
                    {spinner}
                    {confirmation}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
