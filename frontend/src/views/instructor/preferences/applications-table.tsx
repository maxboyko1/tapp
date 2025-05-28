import React from "react";
import { useSelector } from "react-redux";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import {
    Alert,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Typography,
} from "@mui/material";

import { activePositionSelector } from "../store/actions";
import { applicationsSelector } from "../../../api/actions";
import { AdvancedColumnDef, AdvancedFilterTable } from "../../../components/advanced-filter-table";
import {
    Application,
    Assignment,
    InstructorPreference,
    Position
} from "../../../api/defs/types";
import { ApplicantRatingAndComment } from "../../../components/applicant-rating";
import { useThunkDispatch } from "../../../libs/thunk-dispatch";
import { upsertInstructorPreference } from "../../../api/actions/instructor_preferences";
import { ApplicationDetails } from "../../admin/applications/application-details";
import { PropsForElement } from "../../../api/defs/types/react";
import { assignmentsSelector } from "../../../api/actions";
import { generateHeaderCellProps } from "../../../components/table-utils";

const OFFER_STATUS_TO_VARIANT: Record<string, 'success' | 'error' | 'warning'> = {
    accepted: "success",
    rejected: "error",
    withdrawn: "error",
};

export function InstructorApplicationsTable() {
    const activePosition = useSelector(activePositionSelector);
    const allApplications = useSelector(applicationsSelector);
    const assignments = useSelector(assignmentsSelector);

    const assignmentsByApplicantId: Record<number, Assignment[]> =
        React.useMemo(() => {
            const ret: Record<number, Assignment[]> = {};
            for (const assignment of assignments) {
                if (
                    assignment.active_offer_status !== "rejected" &&
                    assignment.active_offer_status !== "withdrawn"
                ) {
                    ret[assignment.applicant.id] =
                        ret[assignment.applicant.id] || [];
                    ret[assignment.applicant.id].push(assignment);
                }
            }

            return ret;
        }, [assignments]);

    const [shownApplicationId, setShownApplicationId] = React.useState<
        number | null
    >(null);
    const dispatch = useThunkDispatch();
    const setInstructorPreference = React.useCallback(
        (pref: InstructorPreference) =>
            dispatch(upsertInstructorPreference(pref)),
        [dispatch]
    );

    const shownApplication =
        allApplications.find(
            (application) => application.id === shownApplicationId
        ) || null;

    const flatApplications = React.useMemo(() => {
        if (!activePosition) {
            return [];
        }
        return allApplications.filter((application) =>
            application.position_preferences.some(
                (preference) =>
                    preference.position.id === activePosition.id &&
                    preference.preference_level !== 0 &&
                    preference.preference_level !== -1
            )
        );
    }, [activePosition, allApplications]);

    flatApplications.sort((a: Application, b: Application) => 
        instructorApplicationsComparator(activePosition, a, b)
    );

    const ConnectedRating = ({
        application,
        ...rest
    }: {
        application: Application;
    } & Pick<PropsForElement<typeof ApplicantRatingAndComment>, "compact">) => {
        const instructorPreference =
            application.instructor_preferences.find(
                (pref) => pref.position.id === activePosition?.id
            ) || null;
        const applicationAndPosition = {
            application,
            position: activePosition,
        };
        return (
            <ApplicantRatingAndComment
                instructorPreference={instructorPreference}
                setInstructorPreference={(newPref: InstructorPreference) =>
                    setInstructorPreference({
                        ...applicationAndPosition,
                        ...newPref,
                    })
                }
                {...rest}
            />
        );
    };
    if (!activePosition) {
        return <h4>No position currently selected</h4>;
    }

    const columns: AdvancedColumnDef<Application>[] = [
        {
            header: "Your Rating",
            id: "instructor_preference",
            Cell: ({ row }) => <ConnectedRating application={row.original} />,
        },
        {
            header: "Application",
            id: "application",
            Cell: ({ row }) => (
                <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setShownApplicationId(row.original.id) }
                    startIcon={<SearchIcon />}
                >
                    View
                </Button>
            ),
        },
        {
            header: "Last Name",
            accessorKey: "applicant.last_name",
        },
        {
            header: "First Name",
            accessorKey: "applicant.first_name",
        },
        {
            header: "Email",
            accessorKey: "applicant.email",
            Cell: ({ row, cell }) => {
                const value = cell.getValue<string>();
                const applicant = row.original.applicant;
                return (
                    <a
                        href={encodeURI(
                            `mailto:${applicant.first_name} ${applicant.last_name} <${value}>?subject=${activePosition.position_code}&body=Dear ${applicant.first_name} ${applicant.last_name},\n\n`
                        )}
                    >
                        {value}
                    </a>
                );
            },
        },
        {
            ...generateHeaderCellProps("Program", "Program: P (PhD), M (Masters), U (Undergrad)"),
            accessorKey: "program",
            size: 90,
        },
        {
            ...generateHeaderCellProps("YIP", "Year of study"),
            accessorKey: "yip",
            size: 50,
        },
        {
            ...generateHeaderCellProps("GPA"),
            accessorKey: "gpa",
            size: 60,
        },
        {
            ...generateHeaderCellProps("Experience"),
            accessorKey: "previous_experience_summary",
        },
        {
            header: "Assignment(s)",
            id: "assignments",
            size: 300,
            Cell: ({ row }) => {
                const assignments: Assignment[] =
                    assignmentsByApplicantId[row.original.applicant.id] || [];
                return (
                    <ul style={{ paddingLeft: 16, margin: 0 }}>
                        {assignments.map((assignment) => (
                            <li key={assignment.position.position_code}>
                                <Chip
                                    label={`${assignment.position.position_code} (${assignment.hours})`}
                                    color={
                                        OFFER_STATUS_TO_VARIANT[
                                            assignment.active_offer_status || ''
                                        ] || 'warning'
                                    }
                                    size="small"
                                    sx={{ mr: 0.5, mb: 0.5 }}
                                />
                            </li>
                        ))}
                    </ul>
                );
            },
        },
    ];

    return (
        <React.Fragment>
            <AdvancedFilterTable
                filterable={true}
                columns={columns}
                data={flatApplications}
            />
            <Dialog
                open={!!shownApplication}
                onClose={() => setShownApplicationId(null)}
                maxWidth="xl"
                fullWidth
            >
                <DialogTitle sx={{ m: 0, p: 2 }}>
                    Application Details
                    <IconButton
                        aria-label="close"
                        onClick={() => setShownApplicationId(null)}
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
                    {shownApplication && (
                        <React.Fragment>
                            <Alert severity="info" sx={{ mb: 2 }}>
                                <Typography variant="h6" component="div">
                                    Your Rating <small>(click to edit)</small>
                                </Typography>
                                <ConnectedRating
                                    application={shownApplication}
                                    compact={false}
                                />
                            </Alert>
                            <ApplicationDetails application={shownApplication} />
                        </React.Fragment>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setShownApplicationId(null)}
                        variant="outlined"
                        color="secondary"
                    >
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </React.Fragment>
    );
}

/**
 * Sort comparator enforcing default ordering scheme for the tables of applications
 * in this view, which is determined by the two applicant's programs, department and
 * specified levels of preference for the position. This order is to be used for both 
 * the table rendered on the page in this view as well as the associated export.
 *
 * Returns < 0 if A comes before B, returns > 0 if A comes after B, and 0 otherwise.
 */
export function instructorApplicationsComparator(
    position: Position | null,
    A: Application,
    B: Application 
): number {
    if (!position) {
        return 0;
    }

    const aPref = A.position_preferences.find(pref => pref.position.id === position.id);
    const bPref = B.position_preferences.find(pref => pref.position.id === position.id);
    if (!aPref || !bPref) {
        return 0;
    }

    const aPriority = getApplicantPriority(A);
    const bPriority = getApplicantPriority(B);
    if (aPriority !== bPriority) {
        return aPriority - bPriority;
    }
    return bPref.preference_level - aPref.preference_level;
}

/**
 * Helper function for instructorApplicationsComparator(). Returns a number representing
 * a priority level for the given application based on the applicant's program and department,
 * with lower numbers signifying higher priority.
 */
function getApplicantPriority(
    application: Application
) {
    if (!application.program || !application.department) {
        return 11;
    }
    const dept = application.department.toLowerCase();
    const prog = application.program.toLowerCase();

    if (["p", "m", "mscac"].includes(prog)) {
        if (dept === "cs") {
            switch (prog) {
                case "p":
                    return 1;
                case "m":
                    return 2;
                default: // "mscac"
                    return 3;
            }
        } else {
            switch (prog) {
                case "p":
                    return 4;
                case "m":
                    return 5;
                default: // "mscac"
                    return 6;
            }
        }
    }

    if (prog === "pd") {
        return 7;
    }
    if (prog === "u") {
        if (dept === "cs") {
            return 8;
        } else {
            return 9;
        }
    }

    return 10;
}