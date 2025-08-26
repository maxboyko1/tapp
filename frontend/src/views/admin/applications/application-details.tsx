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
import { alpha, useTheme, Theme } from "@mui/material/styles";
import { Model } from "survey-core";
import { Survey } from "survey-react-ui";
import { useSelector } from "react-redux";

import { Application, Assignment, Match, Position } from "../../../api/defs/types";
import { DisplayRating } from "../../../components/applicant-rating";
import { formatDateTime, formatDownloadUrl } from "../../../libs/utils";
import {
    activeSessionSelector,
    assignmentsSelector,
    matchesSelector,
} from "../../../api/actions";

import "survey-core/survey-core.css";

interface SurveyJsPage {
    name: string;
    elements: { name: string; type: string }[];
}

// For fields in the table we are extracting from custom_question_answers
type CustomQuestionAnswers = {
    completed_degrees?: string;
    previous_non_dcs_ta?: string;
    previous_industry_work?: string;
    research_interests?: string;
    prior_assignments?: string[];
};

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
 * Create a SurveyJS Model to show in display mode.
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

/**
 * Map applicant preference levels to display colors.
 * @param level preference level from -1 to 4.
 * @returns 
 */
function getApplicantPreferenceChipStyle(theme: Theme, level: number) {
    switch (level) {
        case 4:
            return { backgroundColor: alpha(theme.palette.success.main, 0.8), color: "#fff" };
        case 3:
            return { backgroundColor: alpha(theme.palette.success.main, 0.25), color: theme.palette.success.main };
        case 2:
            return { backgroundColor: alpha(theme.palette.secondary.main, 0.25), color: theme.palette.secondary.main };
        case 1:
            return { backgroundColor: alpha("#007FA3", 0.25), color: "#007FA3" };
        case 0:
            return { backgroundColor: theme.palette.warning.main, color: "#fff" };
        default:
            return { backgroundColor : alpha(theme.palette.error.main, 0.25), color: theme.palette.error.main };
    }
}
/**
 * Map applicant preference levels to human-readable labels.
 * @param level preference level from -1 to 4.
 * @returns 
 */
function getApplicantPreferenceLevelLabel(level: number): string {
    switch (level) {
        case 4: return "1st Choice";
        case 3: return "2nd Choice";
        case 2: return "3rd Choice";
        case 1: return "4th Choice";
        case 0: return "Willing";
        default: return "Unwilling"; // -1 case
    }
}

/**
 * Map offer statuses to specific colors for display. 
 * @param status
 */
function getOfferStatusColor(status: string) {
    switch (status) {
        case "accepted": return "success";
        case "rejected":
        case "withdrawn": return "error";
        default: return "warning";
    }
}

/**
 * Map instructor preference levels to specific colors for display.
 * @param level preference level from -1 to 2.
 * @returns 
 */
function getInstructorPreferenceChipColor(level: number) {
    switch (level) {
        case 2: return "success";
        case 1: return "info";
        case -1: return "error";
        default: return "default"; // case 0 or null, unknown
    }
}

export function ApplicationDetails({
    application,
    activePosition = null,
}: {
    application: Application;
    activePosition?: Position | null;
}) {
    const theme = useTheme();

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

    const customAnswers = (application.custom_question_answers || {}) as CustomQuestionAnswers;

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
                        <TableCell sx={{ fontWeight: "bold" }}>Experience Overview</TableCell>
                        <TableCell>
                            <Stack spacing={1}>
                                {customAnswers && customAnswers.completed_degrees && (
                                    <div>
                                        <span style={{ fontStyle: "italic" }}>
                                            Completed Degrees:
                                        </span>{" "}
                                        {customAnswers.completed_degrees}
                                    </div>
                                )}
                                {customAnswers && customAnswers.previous_non_dcs_ta && (
                                    <div>
                                        <span style={{ fontStyle: "italic" }}>
                                            Non-DCS TA Experience:
                                        </span>{" "}
                                        {customAnswers.previous_non_dcs_ta}
                                    </div>
                                )}
                                {customAnswers.previous_industry_work && (
                                    <div>
                                        <span style={{ fontStyle: "italic" }}>
                                            Industry Work:
                                        </span>{" "}
                                        {customAnswers.previous_industry_work}
                                    </div>
                                )}
                                {customAnswers.research_interests && (
                                    <div>
                                        <span style={{ fontStyle: "italic" }}>
                                            Research Interests:
                                        </span>{" "}
                                        {customAnswers.research_interests}
                                    </div>
                                )}
                            </Stack>
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell sx={{ fontWeight: "bold" }}>Prior Assignments</TableCell>
                        <TableCell>
                            <Stack direction="row" flexWrap="wrap" gap={1}>
                                {customAnswers && customAnswers.prior_assignments?.map((assignment, idx) => (
                                    <Chip
                                        key={assignment + idx}
                                        label={assignment}
                                        color="primary"
                                        variant="outlined"
                                        size="small"
                                        sx={{ mr: 1, mb: 1 }}
                                    />
                                ))}
                            </Stack>
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell sx={{ fontWeight: "bold" }}>Current Assignments</TableCell>
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
                    {/* Show activePosition preference level if activePosition is provided */}
                    {activePosition && (
                        <TableRow>
                            <TableCell sx={{ fontWeight: "bold" }}>
                                {activePosition.position_code} Preference
                            </TableCell>
                            <TableCell>
                                {(() => {
                                    const pref = application.position_preferences.find(
                                        (p) => p.position.position_code === activePosition.position_code
                                    );
                                    const prefLevel = typeof pref?.preference_level === "number" ? pref.preference_level : -1;
                                    return (
                                        <Chip
                                            label={getApplicantPreferenceLevelLabel(prefLevel)}
                                            size="small"
                                            sx={{
                                                ...getApplicantPreferenceChipStyle(theme, prefLevel),
                                                fontWeight: "bold",
                                            }}
                                        />
                                    );
                                })()}
                            </TableCell>
                        </TableRow>
                    )}
                    <TableRow>
                        <TableCell sx={{ fontWeight: "bold" }}>Positions Applied For</TableCell>
                        <TableCell>
                            <Stack direction="row" flexWrap="wrap" gap={1}>
                                {application.position_preferences
                                    .filter((a) => a.preference_level !== -1)
                                    .sort((a, b) =>
                                        a.preference_level > b.preference_level
                                            ? -1
                                            : 1
                                    )
                                    .map((position_preference) => (
                                        <Chip
                                            key={position_preference.position.position_code}
                                            label={`${position_preference.position.position_code} (${position_preference.preference_level})`}
                                            size="small"
                                            sx={{ mr: 1, mb: 1, ...getApplicantPreferenceChipStyle(theme, position_preference.preference_level) }}
                                        />
                                    ))}
                            </Stack>
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell sx={{ fontWeight: "bold" }}>CV/Transcript(s)</TableCell>
                        <TableCell>
                            <Stack direction="row" flexWrap="wrap" gap={1}>
                                {application.documents.map((document) => (
                                    <Button
                                        key={document.name}
                                        href={formatDownloadUrl(`/external/files/${document.url_token}`)}
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
                        <TableCell sx={{ fontWeight: "bold" }}>Instructor Preferences</TableCell>
                        <TableCell>
                            <Stack direction="row" flexWrap="wrap" gap={1}>
                                {instructorPreferences.map((pref) => (
                                    <Chip
                                        key={pref.position.position_code}
                                        label={
                                            <Stack direction="row" alignItems="center" spacing={1} sx={{ whiteSpace: "normal" }}>
                                                <Box component="span" sx={{ fontWeight: "bold" }}>
                                                    {pref.position.position_code}
                                                </Box>
                                                {pref.comment && (
                                                    <Box component="span" sx={{ fontWeight: "normal", ml: 0.5 }}>
                                                        {pref.comment}
                                                    </Box>
                                                )}
                                                <DisplayRating rating={pref.preference_level} />
                                            </Stack>
                                        }
                                        color={getInstructorPreferenceChipColor(pref.preference_level)}
                                        size="small"
                                        sx={{
                                            width: "fit-content",
                                            minWidth: 0,
                                            maxWidth: "100%",
                                            whiteSpace: "normal",
                                        }}
                                    />
                                ))}
                            </Stack>
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell sx={{ fontWeight: "bold" }}>Submission Date</TableCell>
                        <TableCell>{formatDateTime(application.submission_date)}</TableCell>
                    </TableRow>
                    {/* Display posting-specific question answers as survey results */}
                    {application.posting?.custom_questions && (
                        <TableRow>
                            <TableCell sx={{ fontWeight: "bold" }}>Posting-Specific Answers</TableCell>
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
                    {/* Display position-specific question answers as individual survey results,
                      * in descending order of applicant-specified prefrence levels */}
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
                                            ({getApplicantPreferenceLevelLabel(pref.preference_level)})
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
