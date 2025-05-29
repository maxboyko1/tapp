import React from "react";
import { useSelector } from "react-redux";
import {
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";

import {
    applicationsSelector,
    upsertApplicant,
    upsertApplication,
} from "../../../api/actions";
import type {
    Applicant,
    Application,
} from "../../../api/defs/types";
import { ApplicationsList } from "../../../components/applications";
import { useThunkDispatch } from "../../../libs/thunk-dispatch";
import { ApplicationDetails } from "./application-details";
import { formatDate } from "../../../libs/utils";
import { AdvancedColumnDef } from "../../../components/advanced-filter-table";

export function ConnectedApplicationsList() {
    const applicants = useSelector(applicationsSelector) as Application[];
    const dispatch = useThunkDispatch();
    // If `shownApplication` is non-null, a dialog will be displayed with its details.
    const [shownApplication, setShownApplication] =
        React.useState<Application | null>(null);

    const _upsertApplication = React.useCallback(
        (application: Partial<Application>) => {
            return dispatch(upsertApplication(application));
        },
        [dispatch]
    );

    const _upsertApplicant = React.useCallback(
        (applicant: Partial<Applicant>) => {
            return dispatch(upsertApplicant(applicant));
        },
        [dispatch]
    );

    const handleEditRow = React.useCallback(
        (original: Application, values: Partial<Application>) => {
            // Split values into applicant and application updates
            const applicantUpdates: Partial<Applicant> = {};
            const applicationUpdates: Partial<Application> = {};

            Object.entries(values).forEach(([key, val]) => {
                if (key.startsWith("applicant.")) {
                    // Remove "applicant." prefix for applicant fields
                    applicantUpdates[key.replace("applicant.", "") as keyof Applicant] = val as any;
                } else {
                    applicationUpdates[key as keyof Application] = val as any;
                }
            });

            if (Object.keys(applicantUpdates).length > 0) {
                _upsertApplicant({ ...original.applicant, ...applicantUpdates });
            }
            if (Object.keys(applicationUpdates).length > 0) {
                _upsertApplication({ ...original, ...applicationUpdates });
            }
        },
        [_upsertApplication, _upsertApplicant]
    );

    const CellDetailsButton = React.useCallback(({ row }: any) => {
        const application = row?.original || {};
        const firstName = application.applicant?.first_name ?? "";
        const lastName = application.applicant?.last_name ?? "";
        return (
            <IconButton
                className="details-row-button"
                title={`View details of ${firstName} ${lastName}'s Application`}
                onClick={() => setShownApplication(application)}
                size="small"
            >
                <SearchIcon fontSize="inherit" />
            </IconButton>
        );
    }, [setShownApplication]);

    const DEFAULT_COLUMNS: AdvancedColumnDef<Application>[] = React.useMemo(() => [
        {
            header: "Details",
            id: "details-col",
            maxSize: 32,
            enableResizing: false,
            Cell: CellDetailsButton,
        },
        {
            header: "Posting",
            accessorKey: "posting.name",
            size: 90,
        },
        {
            header: "Program",
            accessorKey: "program",
            size: 50,
            meta: { editable: true },
        },
        {
            header: "YIP",
            accessorKey: "yip",
            size: 50,
            meta: { editable: true },
        },
        {
            header: "Last Name",
            accessorKey: "applicant.last_name",
            meta: { editable: true },
        },
        {
            header: "First Name",
            accessorKey: "applicant.first_name",
            meta: { editable: true },
        },
        {
            header: "Email",
            accessorKey: "applicant.email",
            meta: { editable: true },
        },
        {
            header: "Department",
            accessorKey: "department",
            meta: { editable: true },
        },
        {
            header: "UTORid",
            accessorKey: "applicant.utorid",
            meta: { editable: true },
        },
        {
            header: "Student Number",
            accessorKey: "applicant.student_number",
            meta: { editable: true },
        },
        {
            header: "Phone",
            accessorKey: "applicant.phone",
            meta: { editable: true },
        },
        {
            header: "Submitted",
            accessorKey: "submission_date",
            Cell: ({ cell }) => {
                const date = cell.getValue();
                return typeof date === "string" ? formatDate(date) : <></>;
            },
        }
    ], [CellDetailsButton]);

    return (
        <React.Fragment>
            <ApplicationsList
                applicants={applicants}
                columns={DEFAULT_COLUMNS}
                onEditRow={handleEditRow}
            />

            <Dialog
                open={!!shownApplication}
                onClose={() => setShownApplication(null)}
                maxWidth="xl"
                fullWidth
            >
                <DialogTitle sx={{ m: 0, p: 2 }}>
                    Application Details
                    <IconButton
                        aria-label="close"
                        onClick={() => setShownApplication(null)}
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
                    {shownApplication && (
                        <ApplicationDetails application={shownApplication} />
                    )}
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setShownApplication(null)}
                        variant="contained"
                        color="secondary"
                    >
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </React.Fragment>
    );
}
