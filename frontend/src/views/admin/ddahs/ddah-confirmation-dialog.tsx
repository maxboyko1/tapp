import React from "react";
import {
    Alert,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import { AdvancedColumnDef, AdvancedFilterTable } from "../../../components/advanced-filter-table";
import { Ddah } from "../../../api/defs/types";
import { compareString } from "../../../libs/utils";
import { generateHeaderCellProps } from "../../../components/table-utils";
import { ddahIssues, getReadableStatus } from "../../../libs/ddah-utils";

const ddahModalColumn: AdvancedColumnDef<ConfirmationDdahRowData>[] = [
    {
        ...generateHeaderCellProps("Position"),
        accessorKey: "position_code",
        size: 200,
    },
    {
        ...generateHeaderCellProps("Last Name"),
        accessorKey: "last_name",
        maxSize: 120,
    },
    {
        ...generateHeaderCellProps("First Name"),
        accessorKey: "first_name",
        maxSize: 120,
    },
    {
        ...generateHeaderCellProps("Status"),
        accessorKey: "status",
        maxSize: 100,
    },
    {
        ...generateHeaderCellProps("Issues"),
        accessorKey: "issue",
        size: 250,
    },
];

type ConfirmationDdahRowData = {
    id?: number;
    position_code: string;
    last_name: string;
    first_name: string;
    total_hours: number | null;
    status: string;
    issue: string;
};

function compareDDAH(d1: ConfirmationDdahRowData, d2: ConfirmationDdahRowData) {
    return (
        compareString(d1.position_code, d2.position_code) ||
        compareString(d1.last_name, d2.last_name) ||
        compareString(d1.first_name, d2.first_name)
    );
}

export function DdahConfirmationDialog(props: {
    selectedDdahs: Ddah[];
    visible: boolean;
    setVisible: (visible: boolean) => void;
    callback: () => void;
    title: string;
    body: string;
    confirmation: string;
}) {
    const {
        selectedDdahs,
        visible,
        setVisible,
        callback,
        title,
        body,
        confirmation,
    } = props;

    // The omni-search doesn't work on nested properties, so we need to flatten
    // the data we display before sending it to the table.
    const data = selectedDdahs.map((ddah: Ddah) => {
        let ddahIssue = ddahIssues(ddah);
        if (!ddahIssue) {
            ddahIssue = "Missing DDAH";
        }
        return {
            id: ddah.id,
            position_code: ddah.assignment.position.position_code,
            last_name: ddah.assignment.applicant.last_name,
            first_name: ddah.assignment.applicant.first_name,
            total_hours: ddah.total_hours,
            status: getReadableStatus(ddah),
            issue: ddahIssue,
        } as ConfirmationDdahRowData;
    });

    // Sort the table by position_code by default
    data.sort(compareDDAH);

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
                <Alert severity="info" sx={{ mb: 3 }}>
                    <Typography variant="body1">{body}</Typography>
                </Alert>
                <div style={{ marginBottom: 24 }}>
                    <AdvancedFilterTable
                        columns={ddahModalColumn}
                        data={data}
                        filterable={false}
                    />
                </div>
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
                    onClick={() => {
                        callback();
                        setVisible(false);
                    }}
                    variant="contained"
                    color="primary"
                >
                    {confirmation}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
