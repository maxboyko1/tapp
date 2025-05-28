import React from "react";
import { useParams } from "react-router-dom";
import { Model } from "survey-core";
import { DoubleBorderLight } from "survey-core/themes";
import { Survey } from "survey-react-ui";
import {
    Alert,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import { apiGET, apiPOST } from "../../../libs/api-utils";

import "survey-core/survey-core.css";
import "./survey.css";

/**
 * Determine whether a survey.js survey has has at least one
 * position preference available. (Surveys that don't have any position
 * preferences available to be selected are considered invalid.)
 *
 * @param {*} surveyJson
 * @returns {boolean}
 */
function validSurvey(surveyJson: any): boolean {
    for (const page of surveyJson?.pages || []) {
        for (const item of page?.elements || []) {
            if (
                item.name === "willing_positions" &&
                item?.choices?.length > 0
            ) {
                return true;
            }
        }
    }
    return false;
}

function ConfirmDialog({
    submitDialogVisible,
    hideDialogAndResetData,
    applicationOpen,
    submissionError,
    confirmClicked,
    waiting,
}: {
    submitDialogVisible: boolean;
    hideDialogAndResetData: (...args: any[]) => any;
    applicationOpen: boolean;
    submissionError: string | null;
    confirmClicked: (...args: any[]) => any;
    waiting: boolean;
}) {
    const [sessionTimeout, setSessionTimeout] = React.useState(false);
    React.useEffect(() => {
        // If it takes a long time for the user to fill out the posting, their shibboleth
        // session might have timed out. To test for this, we make a dummy call to the backed right
        // when the confirm dialog becomes visible. If the call fails, it means the session has timed out.
        if (submitDialogVisible) {
            apiGET(`/active_user`)
                .then((resp: any) => {
                    if (!resp.utorid) {
                        throw new Error(
                            "Failed to get an authenticated response from the server"
                        );
                    }
                })
                .catch(() => {
                    setSessionTimeout(true);
                });
        } else {
            setSessionTimeout(false);
        }
    }, [submitDialogVisible, setSessionTimeout]);

    return (
        <Dialog open={submitDialogVisible} onClose={hideDialogAndResetData} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ m: 0, p: 2 }}>
                Submit Application
                <IconButton
                    aria-label="close"
                    onClick={hideDialogAndResetData}
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
                {!applicationOpen ? (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        The application window is currently not open. Any
                        applications submitted outside of the application window
                        may not be considered.
                    </Alert>
                ) : null}
                {sessionTimeout && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        <b>Error:</b> Your session has timed out. Please refresh
                        the browser and try again. (Your answers have not been
                        saved, but you may copy-and-paste them to another
                        document before refreshing.)
                    </Alert>
                )}
                {submissionError ? (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        <b>Error:</b> {submissionError} Please review your
                        answers and make sure all questions are answered
                        appropriately.
                        <p className="mb-1">
                            If all your answers look correct, try
                        </p>
                        <ul className="mt-1">
                            <li>
                                Refreshing the browser and trying to submit
                                again.
                            </li>
                            <li>
                                Submitting your application via Firefox or
                                Chrome.
                            </li>
                        </ul>
                    </Alert>
                ) : (
                    <span>Are you sure you want to submit this TA application?</span>
                )}
            </DialogContent>
            <DialogActions>
                <Button variant="contained" color="secondary" onClick={hideDialogAndResetData}>
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={confirmClicked}
                    disabled={!!submissionError}
                    startIcon={waiting ? <CircularProgress size={18} /> : null}
                >
                    Submit
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export function PostingView() {
    const params = useParams<{ url_token?: string }>();
    const url_token = params?.url_token;
    const [surveyJson, setSurveyJson] = React.useState<any>(null);
    const [surveyPrefilledData, setSurveyPrefilledData] =
        React.useState<any>(null);
    const [surveyData, setSurveyData] = React.useState<any>(null);
    const [submitDialogVisible, setSubmitDialogVisible] = React.useState(false);
    const [hasSubmitted, setHasSubmitted] = React.useState(false);
    const [waiting, setWaiting] = React.useState(false);
    const [submissionError, setSubmissionError] = React.useState<string | null>(
        null
    );
    const [applicationOpen, setApplicationOpen] = React.useState(true);

    React.useEffect(() => {
        if (url_token == null) {
            return;
        }
        async function fetchSurvey() {
            try {
                const details: {
                    survey: any;
                    prefilled_data: any;
                    open_status: boolean;
                } = await apiGET(`/public/postings/${url_token}`, true);
                setSurveyJson(details.survey);
                setSurveyPrefilledData(details.prefilled_data);
                setApplicationOpen(details.open_status);
            } catch (e) {
                console.warn(e);
            }
        }
        fetchSurvey();
    }, [url_token, setSurveyJson, setSurveyPrefilledData, setApplicationOpen]);

    console.log("PostingView: surveyJson", surveyJson);

    const survey = React.useMemo(() => {
        if (!surveyJson) return null;

        const survey = new Model(surveyJson);
        survey.applyTheme(DoubleBorderLight);
        survey.showPreviewBeforeComplete = "showAnsweredQuestions";
        survey.showQuestionNumbers = "off";

        // The utorid is auto-filled when the user is actually taking a survey.
        survey.data = surveyData || surveyPrefilledData;

        // If the data has changed but we've finished the survey, make sure to set the survey to
        // a finished state.
        if (hasSubmitted) {
            setTimeout(() => survey.doComplete(), 0);
        }

        return survey;
    }, [surveyJson, surveyData, surveyPrefilledData, hasSubmitted]);

    React.useEffect(() => {
        if (!survey) return;
        // We only want to add this callback once when the survey is initialized
        survey.onCompleting.add((result, options) => {
            if (!hasSubmitted) {
                options.allow = false;
                setSurveyData(result.data);
                setSubmitDialogVisible(true);
                setTimeout(() => survey.showPreview(), 0);
            }
        });
    }, [survey, setSurveyData, setSubmitDialogVisible, hasSubmitted]);

    React.useEffect(() => {
        if (!survey) return;
        survey.onValueChanged.add((sender, options) => {
            if (options.name === "willing_positions") {
                const rankingQuestion = sender.getQuestionByName("position_preferences");
                if (rankingQuestion) {
                    // Only show choices that are in willing_positions
                    const allChoices = surveyJson.pages
                        .find((p: any) =>
                            p.elements.some((el: any) => el.name === "position_preferences")
                        )
                        ?.elements.find((el: any) => el.name === "position_preferences")
                        ?.choices || [];
                    rankingQuestion.choices = allChoices.filter((choice: any) =>
                        (options.value || []).includes(choice.value)
                    );
                }
            }
        });
    }, [survey, surveyJson]);

    if (url_token == null) {
        return <React.Fragment>Unknown URL token.</React.Fragment>;
    }

    if (surveyJson == null || surveyPrefilledData == null) {
        return <React.Fragment>Loading...</React.Fragment>;
    }

    if (!validSurvey(surveyJson)) {
        return (
            <Alert severity="warning">
                There are not positions that can be applied for at this time. An
                administrator may update this posting in the future.
            </Alert>
        );
    }

    async function confirmClicked() {
        console.log("Submitting data", surveyData);
        try {
            setWaiting(true);
            await apiPOST(
                `/public/postings/${url_token}/submit`,
                { answers: surveyData },
                true
            );
            setHasSubmitted(true);
            survey?.doComplete();
            setSurveyData(surveyPrefilledData);
            setSubmitDialogVisible(false);
            setSubmissionError(null);
        } catch (e) {
            console.warn(e);
            setSubmissionError("Could not submit application.");
        } finally {
            setWaiting(false);
        }
    }

    function hideDialogAndResetData() {
        if (survey) {
            survey.data = surveyData || survey.data;
        }
        setHasSubmitted(false);
        setSubmitDialogVisible(false);
        setSubmissionError(null);
    }

    return (
        <React.Fragment>
            {survey && <Survey model={survey} />}
            <ConfirmDialog
                submitDialogVisible={submitDialogVisible}
                hideDialogAndResetData={hideDialogAndResetData}
                applicationOpen={applicationOpen}
                submissionError={submissionError}
                confirmClicked={confirmClicked}
                waiting={waiting}
            />
        </React.Fragment>
    );
}