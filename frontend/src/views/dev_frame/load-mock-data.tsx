import React from "react";
import { useSelector } from "react-redux";
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    LinearProgress,
    ListItemText,
    ListSubheader,
    Menu,
    MenuItem,
    Typography,
} from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";

import { normalizeImport } from "../../libs/import-export";
import {
    instructorsSelector,
    contractTemplatesSelector,
    letterTemplatesSelector,
    upsertApplicant,
    upsertAssignment,
    upsertPosition,
    upsertSession,
    upsertInstructor,
    upsertContractTemplate,
    upsertLetterTemplate,
    setActiveSession,
    positionsSelector,
    activeSessionSelector,
    debugOnlyUpsertUser,
    debugOnlySetActiveUser,
    applicationsSelector,
    fetchActiveUser,
    upsertPosting,
    upsertPostingPosition,
    fetchPositions,
    applicantsSelector,
    fetchApplicants,
    fetchUsers,
    fetchApplications,
    fetchInstructors,
    fetchContractTemplates,
    fetchLetterTemplates,
    fetchAssignments,
    assignmentsSelector,
    instructorPreferencesSelector,
    usersSelector,
} from "../../api/actions";
import { apiGET, apiPOST } from "../../libs/api-utils";
import {
    positionSchema,
    applicantSchema,
    assignmentSchema,
} from "../../libs/schema";
import { useThunkDispatch } from "../../libs/thunk-dispatch";
import { prepareFull } from "../../libs/import-export";
import {
    MinimalAssignment,
    MinimalPosition,
    Session,
} from "../../api/defs/types";
import { seedData } from "../../mock_data";
import { fetchInstructorPreferences } from "../../api/actions/instructor_preferences";

type PromiseOrVoidFunction = (...args: any[]) => Promise<any> | void;

const ident = () => {};

/**
 * A button to automatically set up a mock session with contract/letter templates and
 * instructors, and upsert positions, applicants, and assignments from mock data
 * JSON files in order.
 */
export function SeedDataMenu() {
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const [confirmDialogVisible, setConfirmDialogVisible] =
        React.useState(false);
    const [seedAction, _setSeedAction] = React.useState<PromiseOrVoidFunction>(
        () => ident
    );
    const [inProgress, setInProgress] = React.useState(false);
    const [stage, setStage] = React.useState("");
    const [progress, setProgress] = React.useState(0);
    const dispatch = useThunkDispatch();
    let count;
    let total;

    // Redux selectors
    const reduxApplicants = useSelector(applicantsSelector);
    const reduxApplications = useSelector(applicationsSelector);
    const reduxAssignments = useSelector(assignmentsSelector);
    const reduxContractTemplates = useSelector(contractTemplatesSelector);
    const reduxInstructorPreferences = useSelector(instructorPreferencesSelector);
    const reduxInstructors = useSelector(instructorsSelector);
    const reduxLetterTemplates = useSelector(letterTemplatesSelector);
    const reduxPositions = useSelector(positionsSelector);
    const reduxUsers = useSelector(usersSelector);
    const targetSession = useSelector(activeSessionSelector);

    // Local state for referenced entities
    const [, setAssignments] = React.useState(reduxAssignments);
    const [, setInstructorPreferences] = React.useState(reduxInstructorPreferences);
    const [, setLetterTemplates] = React.useState(reduxLetterTemplates);
    const [, setUsers] = React.useState(reduxUsers);
    const [applicants, setApplicants] = React.useState(reduxApplicants);
    const [applications, setApplications] = React.useState(reduxApplications);
    const [contractTemplates, setContractTemplates] = React.useState(reduxContractTemplates);
    const [currentSession, setCurrentSession] = React.useState<Session | null>(targetSession);
    const [instructors, setInstructors] = React.useState(reduxInstructors);
    const [positions, setPositions] = React.useState(reduxPositions);

    // Keep local state in sync with Redux
    React.useEffect(() => { setApplicants(reduxApplicants); }, [reduxApplicants]);
    React.useEffect(() => { setApplications(reduxApplications); }, [reduxApplications]);
    React.useEffect(() => { setAssignments(reduxAssignments); }, [reduxAssignments]);
    React.useEffect(() => { setContractTemplates(reduxContractTemplates); }, [reduxContractTemplates]);
    React.useEffect(() => { setCurrentSession(targetSession); }, [targetSession]);
    React.useEffect(() => { setInstructorPreferences(reduxInstructorPreferences); }, [reduxInstructorPreferences]);
    React.useEffect(() => { setInstructors(reduxInstructors); }, [reduxInstructors]);
    React.useEffect(() => { setLetterTemplates(reduxLetterTemplates); }, [reduxLetterTemplates]);
    React.useEffect(() => { setPositions(reduxPositions); }, [reduxPositions]);
    React.useEffect(() => { setUsers(reduxUsers); }, [reduxUsers]);

    // If a function is passed to a `useSate` setter, it is evaluated.
    // Since we want to set the state to a function, we need to wrap the setter,
    // so that it does the right thing.
    function setSeedAction(action: PromiseOrVoidFunction) {
        _setSeedAction(() => action);
    }

    const seedActions = {
        user: { name: `Users (${seedData.users.length})`, action: seedUsers },
        session: { name: "Session (1)", action: seedSession },
        contractTemplate: {
            name: "Contract Templates (2)",
            action: seedContractTemplate,
        },
        letterTemplate: {
            name: "Letter Template (1)",
            action: seedLetterTemplate,
        },
        instructors10: {
            name: "Instructors (10)",
            action: () => seedInstructors(10),
        },
        instructors: {
            name: `Instructors (${seedData.instructors.length})`,
            action: seedInstructors,
        },
        position10: { name: "Positions (10)", action: () => seedPositions(10) },
        position: {
            name: `Positions (${seedData.positions.length})`,
            action: seedPositions,
        },
        applicant10: {
            name: "Applicants (10)",
            action: () => seedApplicants(10),
        },
        applicant: {
            name: `Applicants (${seedData.applicants.length})`,
            action: seedApplicants,
        },
        assignment10: {
            name: "Assignments (10)",
            action: () => seedAssignments(10),
        },
        assignment: {
            name: `Assignment (${seedData.assignments.length})`,
            action: seedAssignments,
        },
        application: {
            name: `Applications (${seedData.applications.length})`,
            action: seedApplications,
        },
        instructorPref: {
            name: `Instructor Preferences (${seedData.applications.length})`,
            action: seedInstructorPreferences,
        },
        all: { name: "All Data", action: seedAll },
        matching: { name: "All Matching Data", action: seedMatching },
    };

    async function seedSession() {
        setStage("Session");
        setProgress(0);

        let newSession: Session;
        if (targetSession === null) {
            // create the mock session
            const mockSessionData = {
                start_date: "2020/01/01",
                end_date: "2021/12/31",
                name: `Session ${new Date().toLocaleString()}`,
                rate1: 50,
            };
            newSession = await dispatch(upsertSession(mockSessionData));
        } else {
            // use the selected session
            newSession = targetSession;
        }
        await dispatch(setActiveSession(newSession));
        setCurrentSession(newSession);
        setProgress(100);
    }

    async function seedUsers(limit = 600) {
        setProgress(0);
        setStage("Users");
        const users = seedData.users.slice(0, limit);
        count = 0;
        for (const user of users) {
            await dispatch(debugOnlyUpsertUser(user));
            count++;
            setProgress(Math.round((count / users.length) * 100));
        }
        await dispatch(fetchUsers());
        setProgress(100);
    }

    async function seedContractTemplate() {
        setProgress(0);
        setStage("Contract Template");
        for (const template of seedData.contractTemplates) {
            await dispatch(upsertContractTemplate(template));
        }
        await dispatch(fetchContractTemplates());
        setProgress(100);
    }

    async function seedLetterTemplate() {
        setProgress(0);
        setStage("Letter Template");
        for (const template of seedData.letterTemplates) {
            await dispatch(upsertLetterTemplate(template));
        }
        await dispatch(fetchLetterTemplates());
        setProgress(100);
    }

    async function seedInstructors(limit = 1000) {
        setStage("Instructors");
        setProgress(0);
        for (const instructor of seedData.instructors.slice(0, limit)) {
            if (
                !instructors.some((inst) => inst.utorid === instructor.utorid)
            ) {
                const newInstructor = await dispatch(
                    upsertInstructor(instructor)
                );
                instructors.push(newInstructor);
            }
        }
        await dispatch(fetchInstructors());
        setProgress(100);
    }

    async function seedPositions(limit = 1000) {
        setStage("Positions");
        setProgress(0);
        count = 0;
        total = seedData.positions.length;

        const data = (
            normalizeImport(
                {
                    fileType: "json",
                    data: seedData.positions,
                },
                positionSchema
            ) as MinimalPosition[]
        ).map((position) =>
            prepareFull.position(position, {
                instructors,
                contractTemplates,
            })
        );
        for (const position of data.slice(0, limit)) {
            await dispatch(upsertPosition(position));
            count++;
            setProgress(Math.round((count / total) * 100));
        }
        await dispatch(fetchPositions());
        setProgress(100);
    }

    async function seedApplicants(limit = 1000) {
        setStage("Applicants");
        setProgress(0);
        count = 0;
        total = seedData.applicants.length;
        const data = normalizeImport(
            {
                fileType: "json",
                data: seedData.applicants,
            },
            applicantSchema
        );
        for (const a of data.slice(0, limit)) {
            const applicant = await dispatch(upsertApplicant(a));
            applicants.push(applicant);
            count++;
            setProgress(Math.round((count / total) * 100));
        }
        await dispatch(fetchApplicants());
        setProgress(100);
    }

    async function seedAssignments(limit = 1000) {
        setStage("Assignments");
        setProgress(0);
        if (!currentSession) {
            throw new Error("Need a valid session to continue");
        }
        count = 0;
        total = seedData.assignments.length;
        const data = (
            normalizeImport(
                {
                    fileType: "json",
                    data: seedData.assignments,
                },
                assignmentSchema
            ) as MinimalAssignment[]
        ).map((assignment) => {
            if (!currentSession) {
                throw new Error("Need a valid session to continue");
            }
            return prepareFull.assignment(assignment, {
                positions,
                applicants,
                session: currentSession,
            });
        });
        for (const a of data.slice(0, limit)) {
            await dispatch(upsertAssignment(a));
            count++;
            setProgress(Math.round((count / total) * 100));
        }
        await dispatch(fetchAssignments());
        setProgress(100);
    }

    async function seedApplications(limit = 600) {
        setStage("Applications");
        setProgress(0);

        if (!currentSession) {
            throw new Error("Need a valid session to continue");
        }

        let count = 0;
        const total = seedData.applications.length;

        // Keep track of the original active user so we can swap back
        const initialUser = await dispatch(fetchActiveUser());

        // Get this session's posting token:
        const resp = await apiGET(
            `/admin/sessions/${currentSession.id}/postings`
        );

        if (resp.length === 0) {
            throw new Error("No postings found");
        }

        // Seeded applications are directed at the first posting of the active session
        const url_token = resp[0].url_token;

        for (const application of seedData.applications.slice(0, limit)) {
            const currUser = {
                utorid: application.utorid,
                roles: ["admin", "instructor", "ta"],
            };
            await dispatch(
                debugOnlySetActiveUser(currUser, { skipInit: true })
            );

            const newApp = {
                utorid: application.utorid,
                student_number: application.student_number,
                first_name: application.first_name,
                last_name: application.last_name,
                email: application.email,
                phone: application.phone.toString(),
                program: application.program,
                department: application.department,
                yip: application.yip,
                gpa: application.gpa || 0,
                program_start: application.program_start,
                previous_other_university_ta:
                    application.previous_other_university_ta,
                position_preferences: application.position_preferences,
            };

            await apiPOST(
                `/external/postings/${url_token}/submit`,
                { answers: newApp },
                true
            );

            count++;
            setProgress(Math.round((count / total) * 100));
        }

        await dispatch(
            debugOnlySetActiveUser({
                utorid: initialUser.utorid,
                roles: initialUser.roles,
            })
        );

        await dispatch(fetchApplications());
        setProgress(100);
    }

    async function seedInstructorPreferences(limit = 600) {
        setStage("Instructor Preferences");
        setProgress(0);

        if (!currentSession) {
            throw new Error("Need a valid session to continue");
        }

        let count = 0;
        const total = seedData.applications.length;

        for (const application of seedData.applications.slice(0, limit)) {
            if (application.instructor_preferences) {
                const targetApplication =
                    applications.find(
                        (currApplication) =>
                            currApplication.applicant.utorid ===
                            application.utorid
                    ) || null;

                if (!targetApplication) {
                    throw new Error("No application found for " + application);
                }

                for (const position of application.instructor_preferences) {
                    const targetPosition =
                        positions.find(
                            (currPosition) =>
                                currPosition.position_code ===
                                position.position_code
                        ) || null;

                    if (!targetPosition) {
                        throw new Error(
                            "No position found for " + position.position_code
                        );
                    }

                    await apiPOST(`/instructor/instructor_preferences`, {
                        preference_level: position.preference_level,
                        comment: position.comment,
                        application_id: targetApplication.id,
                        position_id: targetPosition.id,
                    });
                }
            }
            count++;
            setProgress(Math.round((count / total) * 100));
        }
        await dispatch(fetchInstructorPreferences());
        setProgress(100);
    }

    async function seedAll() {
        try {
            setConfirmDialogVisible(false);
            setInProgress(true);

            await seedSession();
            await seedContractTemplate();
            await seedLetterTemplate();
            await seedInstructors();
            await seedPositions();
            await seedApplicants();
            await seedAssignments();
        } catch (error) {
            console.error(error);
        } finally {
            setInProgress(false);
        }
    }

    async function seedMatching() {
        try {
            setConfirmDialogVisible(false);
            setInProgress(true);

            setStage("Matching Data");

            // Keep track of current user so we can swap back at the end
            const initialUser = await dispatch(fetchActiveUser());

            // // Create a new session
            const mockSessionData = {
                start_date: "2021/01/01",
                end_date: "2022/12/31",
                name: `Session ${new Date().toLocaleString()}`,
                rate1: 50,
                applications_visible_to_instructors: true,
            };
            const newSession = await dispatch(upsertSession(mockSessionData));
            await dispatch(setActiveSession(newSession));
            setCurrentSession(newSession); // update local state

            await seedContractTemplate();
            await seedLetterTemplate();
            await seedUsers();
            await seedInstructors();
            await seedPositions();

            // Create a new posting
            setStage("Posting");
            const newPosting = await dispatch(
                upsertPosting({
                    name: "Matching Data Posting",
                    open_date: "2022-01-01T00:00:00.000Z",
                    close_date: "2022-12-31T00:00:00.000Z",
                    intro_text: "This is a test posting for matching data.",
                    availability: "auto",
                    custom_questions: null,
                    open_status: true,
                })
            );

            // Add all seeded positions to posting:
            const sessionPositions = await dispatch(fetchPositions());

            setStage("Posting Positions");
            for (const position of sessionPositions) {
                await dispatch(
                    upsertPostingPosition({
                        position_id: position.id,
                        posting_id: newPosting.id,
                        hours: position.hours_per_assignment,
                        num_positions: Math.floor(Math.random() * 29) + 1,
                    })
                );
            }

            await seedApplications();

            // Temporarily set user to someone marked as an instructor in all positions
            await dispatch(
                debugOnlySetActiveUser(
                    {
                        utorid: "smithh",
                        roles: ["admin, instructor", "ta"],
                    },
                    { skipInit: true }
                )
            );
            await seedInstructorPreferences();

            // Go back to the original user
            await dispatch(
                debugOnlySetActiveUser({
                    utorid: initialUser.utorid,
                    roles: initialUser.roles,
                })
            );
        } catch (error) {
            console.error(error);
        } finally {
            setInProgress(false);
        }
    }

    function onSelectHandler(eventKey: string | null) {
        setSeedAction(
            seedActions[eventKey as keyof typeof seedActions]?.action || ident
        );
        setConfirmDialogVisible(true);
    }

    return (
        <span
            title="Load seed data. If a new session is not specified, the active session is used."
            className="mock-button"
        >
            <Button
                variant="contained"
                color="primary"
                endIcon={<ArrowDropDownIcon />}
                onClick={(e) => setAnchorEl(e.currentTarget)}
            >
                Seed Data
            </Button>
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
            >
                <ListSubheader>Load seed data into current session</ListSubheader>
                {Object.keys(seedActions).map((key: string) => (
                    <MenuItem
                        key={key}
                        onClick={() => {
                            onSelectHandler(key);
                            setAnchorEl(null);
                        }}
                    >
                        <ListItemText>
                            {seedActions[key as keyof typeof seedActions].name}
                        </ListItemText>
                    </MenuItem>
                ))}
            </Menu>

            {/* Confirm Dialog */}
            <Dialog
                open={confirmDialogVisible}
                onClose={() => setConfirmDialogVisible(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Loading Seed Data</DialogTitle>
                <DialogContent>
                    <Typography>
                        {currentSession === null ? (
                            "Are you sure to create a new session and load mock data?"
                        ) : (
                            <>
                                Are you sure to load mock data into the session{" "}
                                <b>{currentSession.name}</b>?
                            </>
                        )}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button
                        variant="contained"
                        color="secondary"
                        onClick={() => setConfirmDialogVisible(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={async () => {
                            try {
                                setConfirmDialogVisible(false);
                                setInProgress(true);
                                await seedAction();
                            } catch (e) {
                                console.log(e);
                            } finally {
                                setInProgress(false);
                            }
                        }}
                    >
                        Confirm
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Progress Dialog */}
            <Dialog open={inProgress} maxWidth="sm" fullWidth>
                <DialogTitle>{`Upserting mock ${stage}`}</DialogTitle>
                <DialogContent>
                    <Box
                        display="flex"
                        flexDirection="column"
                        alignItems="center"
                        justifyContent="center"
                        minHeight={100}
                    >
                        <LinearProgress
                            variant="determinate"
                            value={progress}
                            sx={{ width: "90%", mb: 2 }}
                        />
                        <Typography>{progress}%</Typography>
                    </Box>
                </DialogContent>
            </Dialog>
        </span>
    );
}
