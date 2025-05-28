import React from "react";
import{
    Alert,
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableRow,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import { Model } from "survey-core";
import { Survey } from "survey-react-ui";
import { useSelector } from "react-redux";

import { Application, Assignment, Match } from "../../../api/defs/types";
import { DisplayRating } from "../../../components/applicant-rating";
import { formatDateTime, formatDownloadUrl } from "../../../libs/utils";
import {
    activeSessionSelector,
    assignmentsSelector,
    matchesSelector,
} from "../../../api/actions";

interface SurveyJsPage {
    name: string;
    elements: { name: string; type: string }[];
}

export function PreferencesLinkDialog({
    visible,
    onHide,
}: {
    visible: boolean;
    onHide: (...args: any[]) => void;
}) {
    const activeSession = useSelector(activeSessionSelector);
    const url = new URL(window.location.origin);
    url.searchParams.append("role", "instructor");
    url.searchParams.append("activeSession", "" + activeSession?.id);

    let warning = null;
    if (activeSession == null) {
        warning = (
            <Alert severity="warning">
                A valid link can only be generated if a session is selected.
            </Alert>
        );
    }
    if (activeSession?.applications_visible_to_instructors === false) {
        warning = (
            <Alert severity="warning">
                Instructors can only provide preferences when{" "}
                <b>Applications Visible to Instructors</b>
                is set to <b>True</b> via the <i>Sessions</i> page.
            </Alert>
        );
    }

    return (
        <Dialog open={visible} onClose={onHide} maxWidth="lg" fullWidth>
            <DialogTitle sx={{ m: 0, p: 2 }}>
                Instructor Preferences URL
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
                {warning}
                <p>
                    You can distribute the following link to allow instructors
                    to view applications of and give feedback about applicants
                    for their courses in the <em>{activeSession?.name}</em>{" "}
                    session.
                </p>
                <p>
                    <a href={url.href}>{url.href}</a>
                </p>
            </DialogContent>
            <DialogActions>
                <Button onClick={onHide} variant="contained" color="secondary">
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
}

/**
 * Strip any SurveyJs questions of type `html` from the question list.
 * `html` questions are just descriptions without answers, so we
 * normally don't show them.
 *
 * @param {*} custom_questions
 * @returns
 */
function removeHtmlQuestions(custom_questions: any) {
    if (!Array.isArray(custom_questions.pages)) {
        return custom_questions;
    }
    const pages: SurveyJsPage[] = custom_questions.pages;
    const filteredPages = pages.map((page) => ({
        ...page,
        elements: page.elements?.filter((elm) => elm.type !== "html") || [],
    }));

    return { ...custom_questions, pages: filteredPages };
}

/**
 * Create a SurveyJS Model to show with display mode.
 */
function createSurveyModel(jsonSurvey: any, data: any) {
    const survey = new Model(jsonSurvey);
    survey.showPreviewBeforeComplete = "showAnsweredQuestions";
    survey.showQuestionNumbers = "off";
    survey.questionsOnPageMode = "singlePage";
    survey.mode = "display";
    survey.data = data;
    return survey;
}

const getPreferenceChipColor = (level: number) => {
    switch (level) {
        case 4: return "success";
        case 3: return "primary";
        case 2: return "secondary";
        case 1: return "warning";
        case 0: return "info";
        case -1: return "error";
        default: return "default";
    }
};

const getOfferStatusColor = (status: string) => {
    switch (status) {
        case "accepted": return "success";
        case "rejected":
        case "withdrawn": return "error";
        default: return "warning";
    }
};

function getPreferenceLevelLabel(level: number): string {
    switch (level) {
        case 4: return "First Choice";
        case 3: return "Second Choice";
        case 2: return "Third Choice";
        case 1: return "Fourth Choice";
        case 0: return "Willing";
        default: return "";
    }
}

export function ApplicationDetails({
    application,
}: {
    application: Application;
}) {
    const instructorPreferences = application.instructor_preferences;
    const assignments = useSelector(assignmentsSelector) as Assignment[];
    const applicantAssignments = React.useMemo(() => {
        return assignments.filter(
            (assignment) =>
                !!assignment.active_offer_status &&
                assignment.applicant === application.applicant
        );
    }, [assignments, application]);

    const matches = useSelector(matchesSelector) as Match[];
    const applicantMatches = React.useMemo(() => {
        return matches.filter(
            (match) =>
                match.applicant === application.applicant && match.assigned
        );
    }, [matches, application]);

    return (
        <TableContainer component={Paper}>
            <Table size="small">
                <TableBody>
                    <TableRow>
                        <TableCell sx={{ fontWeight: "bold", width: 180 }}>First Name</TableCell>
                        <TableCell>{application.applicant.first_name}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell sx={{ fontWeight: "bold" }}>Last Name</TableCell>
                        <TableCell>{application.applicant.last_name}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell sx={{ fontWeight: "bold" }}>Email</TableCell>
                        <TableCell>{application.applicant.email}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell sx={{ fontWeight: "bold" }}>UTORid</TableCell>
                        <TableCell>{application.applicant.utorid}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell sx={{ fontWeight: "bold" }}>Student Number</TableCell>
                        <TableCell>{application.applicant.student_number}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell sx={{ fontWeight: "bold" }}>Phone</TableCell>
                        <TableCell>{application.applicant.phone}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell sx={{ fontWeight: "bold" }}>Department</TableCell>
                        <TableCell>{application.department}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell sx={{ fontWeight: "bold" }}>Program</TableCell>
                        <TableCell>{application.program}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell sx={{ fontWeight: "bold" }}>Year in Progress</TableCell>
                        <TableCell>{application.yip}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell sx={{ fontWeight: "bold" }}>CV/LinkedIn</TableCell>
                        <TableCell>{application.cv_link}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell sx={{ fontWeight: "bold" }}>Previous Experience</TableCell>
                        <TableCell>
                            {application.previous_department_ta != null
                                ? application.previous_department_ta === true
                                    ? "TAed for department; "
                                    : "Has not TAed for department; "
                                : null}
                            {application.previous_university_ta != null
                                ? application.previous_university_ta === true
                                    ? "TAed for university; "
                                    : "Has not TAed at this university; "
                                : null}
                            {application.previous_experience_summary
                                ? `Experience Summary: ${application.previous_experience_summary}`
                                : null}
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell sx={{ fontWeight: "bold" }}>Positions Applied For</TableCell>
                        <TableCell>
                            <Stack direction="row" flexWrap="wrap" gap={1}>
                                {application.position_preferences
                                    .filter(
                                        (position_preference) =>
                                            position_preference.preference_level !== 0
                                    )
                                    .sort((a, b) =>
                                        a.preference_level > b.preference_level
                                            ? -1
                                            : 1
                                    )
                                    .map((position_preference) => (
                                        <Chip
                                            key={position_preference.position.position_code}
                                            label={`${position_preference.position.position_code} (${position_preference.preference_level})`}
                                            color={getPreferenceChipColor(position_preference.preference_level)}
                                            size="small"
                                            sx={{ mr: 1, mb: 1 }}
                                        />
                                    ))}
                            </Stack>
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell sx={{ fontWeight: "bold" }}>Positions Assigned To</TableCell>
                        <TableCell>
                            <Stack direction="row" flexWrap="wrap" gap={1}>
                                {applicantMatches.map((match) => (
                                    <Chip
                                        key={match.position.position_code}
                                        label={`${match.position.position_code} (${match.hours_assigned})`}
                                        color="info"
                                        variant="outlined"
                                        size="small"
                                        sx={{ mr: 1, mb: 1 }}
                                    />
                                ))}
                                {applicantAssignments.map((assignment) => (
                                    <Chip
                                        key={assignment.position.position_code}
                                        label={`${assignment.position.position_code} (${assignment.hours})`}
                                        color={getOfferStatusColor(assignment.active_offer_status ?? "")}
                                        variant="outlined"
                                        size="small"
                                        sx={{ mr: 1, mb: 1 }}
                                    />
                                ))}
                            </Stack>
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell sx={{ fontWeight: "bold" }}>Supporting Documents</TableCell>
                        <TableCell>
                            <Stack direction="row" flexWrap="wrap" gap={1}>
                                {application.documents.map((document) => (
                                    <Button
                                        key={document.name}
                                        href={formatDownloadUrl(`/public/files/${document.url_token}`)}
                                        title={`Download ${document.name} (${Math.round(document.size / 1024)} kb)`}
                                        variant="outlined"
                                        size="small"
                                        sx={{ mr: 2, mb: 1, textTransform: "none" }}
                                        target="_blank"
                                        rel="noopener"
                                    >
                                        <DownloadIcon fontSize="inherit" sx={{ mr: 1 }} />
                                        {document.name}
                                    </Button>
                                ))}
                            </Stack>
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell sx={{ fontWeight: "bold" }}>Additional Comments</TableCell>
                        <TableCell>{application.comments}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell sx={{ fontWeight: "bold" }}>Instructor Comments</TableCell>
                        <TableCell>
                            <Stack direction="row" flexWrap="wrap" gap={1}>
                                {instructorPreferences
                                    .filter(
                                        (pref) =>
                                            !(!pref.comment && pref.preference_level === 0)
                                    )
                                    .map((pref) => (
                                        <Chip
                                            key={pref.position.position_code}
                                            label={
                                                <Box component="span" display="flex" alignItems="center" gap={1}>
                                                    {pref.position.position_code}
                                                    <DisplayRating rating={pref.preference_level} />
                                                </Box>
                                            }
                                            color="default"
                                            variant="outlined"
                                            size="small"
                                            sx={{ mr: 1, mb: 1 }}
                                        />
                                    ))}
                            </Stack>
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell sx={{ fontWeight: "bold" }}>Submission Date</TableCell>
                        <TableCell>{formatDateTime(application.submission_date)}</TableCell>
                    </TableRow>
                    {application.posting?.custom_questions && (
                        <TableRow>
                            <TableCell sx={{ fontWeight: "bold" }}>Posting Answers</TableCell>
                            <TableCell>
                                <Survey
                                    model={createSurveyModel(
                                        removeHtmlQuestions(application.posting.custom_questions),
                                        application.custom_question_answers
                                    )}
                                />
                            </TableCell>
                        </TableRow>
                    )}
                    {application.position_preferences
                        .filter(
                            (pref) =>
                                pref.preference_level > -1 &&
                                Object.keys(pref.custom_question_answers || {}).length > 0
                        )
                        .sort((a, b) => b.preference_level - a.preference_level)
                        .map((pref) => {
                            const position = pref.position;
                            const customQuestions = position.custom_questions;
                            if (!customQuestions) return null;

                            const filteredQuestions = removeHtmlQuestions(customQuestions);
                            const positionSurvey = createSurveyModel(filteredQuestions, pref.custom_question_answers);

                            return (
                                <TableRow key={position.position_code}>
                                    <TableCell sx={{ fontWeight: "bold" }}>
                                        {position.position_code} Answers
                                        {" "}
                                        <span style={{ fontWeight: "normal", color: "#888" }}>
                                            ({getPreferenceLevelLabel(pref.preference_level)})
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <Survey model={positionSurvey} />
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
