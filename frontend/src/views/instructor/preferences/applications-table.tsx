import React from "react";
import { useSelector } from "react-redux";
import { activePositionSelector } from "../store/actions";
import { applicationsSelector } from "../../../api/actions";
import { AdvancedFilterTable } from "../../../components/filter-table/advanced-filter-table";
import {
    Application,
    Assignment,
    InstructorPreference,
} from "../../../api/defs/types";
import { generateHeaderCell } from "../../../components/table-utils";
import { ApplicantRatingAndComment } from "../../../components/applicant-rating";
import { useThunkDispatch } from "../../../libs/thunk-dispatch";
import { upsertInstructorPreference } from "../../../api/actions/instructor_preferences";
import { CellProps } from "react-table";
import { Alert, Button, Modal, Badge } from "react-bootstrap";
import { FaSearch } from "react-icons/fa";
import { ApplicationDetails } from "../../admin/applications/application-details";
import { PropsForElement } from "../../../api/defs/types/react";
import { assignmentsSelector } from "../../../api/actions";

const OFFER_STATUS_TO_VARIANT: Record<string, string> = {
    accepted: "success",
    rejected: "danger",
    withdrawn: "danger",
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
                    preference.preference_level !== 0
            )
        );
    }, [activePosition, allApplications]);

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

    const columns = [
        {
            Header: "Your Rating",
            id: "instructor_preference",
            Cell: (props: CellProps<Application>) => (
                <ConnectedRating application={props.row.original} />
            ),
        },
        {
            Header: "Application",
            id: "application",
            Cell: (props: CellProps<Application>) => {
                const application = props.row.original;
                return (
                    <div style={{ display: "flex", justifyContent: "center" }}>
                        <Button
                            variant="info"
                            size="sm"
                            className="mr-2 py-0"
                            title="View the full Application"
                            onClick={() => {
                                setShownApplicationId(application.id);
                            }}
                        >
                            <FaSearch className="mr-2" />
                            View
                        </Button>
                    </div>
                );
            },
        },
        {
            Header: "Last Name",
            accessor: "applicant.last_name",
        },
        {
            Header: "First Name",
            accessor: "applicant.first_name",
        },
        {
            Header: "Email",
            accessor: "applicant.email",
            Cell: ({
                value,
                row,
            }: {
                value: string;
                row: { original: Assignment };
            }) => {
                const assignment = row.original;
                const applicant = assignment.applicant;
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
            Header: generateHeaderCell(
                "Program",
                "Program: P (PhD), M (Masters), U (Undergrad)"
            ),
            width: 90,
            accessor: "program",
        },
        {
            Header: generateHeaderCell("YIP", "Year of study"),
            width: 50,
            accessor: "yip",
        },
        {
            Header: generateHeaderCell("GPA"),
            width: 60,
            accessor: "gpa",
        },
        {
            Header: generateHeaderCell("Experience"),
            accessor: "previous_experience_summary",
        },
        {
            Header: "Assignment(s)",
            id: "assignments",
            width: 300,
            Cell: (props: CellProps<Application>) => {
                const assignments: Assignment[] =
                    assignmentsByApplicantId[props.row.original.applicant.id] ||
                    [];
                return (
                    <ul className="position-preferences-list">
                        {assignments.map((assignment) => (
                            <Badge
                                as="li"
                                key={assignment.position.position_code}
                                variant={
                                    OFFER_STATUS_TO_VARIANT[
                                        assignment.active_offer_status || ""
                                    ] || "warning"
                                }
                            >
                                {assignment.position.position_code} (
                                {assignment.hours})
                            </Badge>
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

            <Modal
                show={!!shownApplication}
                onHide={() => setShownApplicationId(null)}
                size="xl"
            >
                <Modal.Header closeButton>
                    <Modal.Title>Application Details</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {shownApplication && (
                        <React.Fragment>
                            <Alert variant="primary">
                                <Alert.Heading>
                                    Your Rating <small>(click to edit)</small>
                                </Alert.Heading>
                                <ConnectedRating
                                    application={shownApplication}
                                    compact={false}
                                />
                            </Alert>
                            <ApplicationDetails
                                application={shownApplication}
                            />
                        </React.Fragment>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        onClick={() => setShownApplicationId(null)}
                        variant="outline-secondary"
                    >
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </React.Fragment>
    );
}
