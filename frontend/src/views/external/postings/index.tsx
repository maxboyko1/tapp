import React from "react";
import { useParams } from "react-router-dom";
import { ElementFactory, Model, Question, Serializer } from "survey-core";
import { DoubleBorderLight } from "survey-core/themes";
import { ReactQuestionFactory, Survey, SurveyQuestionElementBase } from "survey-react-ui";
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Collapse,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Paper,
    Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

import { apiGET, apiPOST } from "../../../libs/api-utils";

import "core-js/stable";
import "survey-core/survey-core.css";

// --- Position Preferences Custom Drag/Drop Board Component ---

// Defines static info for rendering the preference regions of the board
const PREFERENCE_REGIONS = [
    {
        level: 4,
        label: "1st Choice",
        capacity: 1,
        background: "#e0f7f4",
        borderLeft: "#00a189",
        color: "#00a189"
    },
    {
        level: 3,
        label: "2nd Choices",
        capacity: 3,
        background: "#f3fae5",
        borderLeft: "#8dbf2e",
        color: "#8dbf2e"
    },
    {
        level: 2,
        label: "3rd Choices",
        capacity: 3,
        background: "#fae6f0",
        borderLeft: "#ab1368",
        color: "#ab1368"
    },
    {
        level: 1,
        label: "4th Choices",
        capacity: 3,
        background: "#ede6f1",
        borderLeft: "#6d247a",
        color: "#6d247a"
    },
    {
        level: 0,
        label: "Willing",
        capacity: Infinity,
        background: "#fffbe7",
        borderLeft: "#f1c500",
        color: "#f1c500"
    },
    {
        level: -1,
        label: "Unwilling",
        capacity: Infinity,
        background: "#f0f0f0",
        borderLeft: "#b0b0b0",
        color: "#b0b0b0"
    }
];

// Returns the initial board state: all positions start in the "Unwilling" region (-1).
function getInitialBoardState(choices: any[]): Record<number, string[]> {
    const state: Record<number, string[]> = {};
    for (const region of PREFERENCE_REGIONS) {
        state[region.level] = [];
    }
    for (const choice of choices) {
        state[-1].push(choice.id);
    }
    return state;
}

// Converts a value object (from SurveyJS) into the board state structure.
function getBoardStateFromValue(value: Record<string, number>, choices: any[]): Record<number, string[]> {
    const state: Record<number, string[]> = {};
    for (const region of PREFERENCE_REGIONS) {
        state[region.level] = [];
    }
    for (const choice of choices) {
        const level = value?.[choice.id] ?? -1;
        state[level].push(choice.id);
    }
    return state;
}

// Converts the board state back into a value object for SurveyJS (position.id -> preference_level).
function getValueFromBoardState(boardState: Record<number, string[]>): Record<string, number> {
    const value: Record<string, number> = {};
    for (const region of PREFERENCE_REGIONS) {
        for (const id of boardState[region.level]) {
            value[id] = region.level;
        }
    }
    return value;
}

// Handles moving an item from one region to another, ensuring no duplicates and
// enforcing region capacity.
function moveItem(
    boardState: Record<number, string[]>,
    source: { droppableId: string; index: number },
    destination: { droppableId: string; index: number }
): Record<number, string[]> {
    const sourceLevel = Number(source.droppableId);
    const destLevel = Number(destination.droppableId);

    // If dropped in the same place, do nothing
    if (sourceLevel === destLevel && source.index === destination.index) {
        return boardState;
    }

    const sourceList = Array.from(boardState[sourceLevel]);
    const destList = Array.from(boardState[destLevel]);

    // Prevent duplicate: if moving within same region and item is already at dest index
    if (sourceLevel === destLevel && destList[destination.index] === sourceList[source.index]) {
        return boardState;
    }

    const [removed] = sourceList.splice(source.index, 1);

    // Prevent duplicate: if already present in destList, do not insert again
    if (destList.includes(removed)) {
        return boardState;
    }

    destList.splice(destination.index, 0, removed);

    return {
        ...boardState,
        [sourceLevel]: sourceList,
        [destLevel]: destList,
    };
}

// --- SurveyJS Drag/Drop Question Registration ---

const CUSTOM_TYPE = "preference-board";

// SurveyJS model for the custom drag/drop question type
class QuestionPreferenceBoardModel extends Question {
    getType() { return CUSTOM_TYPE; }
    get positions() { return this.getPropertyValue("positions"); }
    set positions(val) { this.setPropertyValue("positions", val); }
}

// Register the custom question type with SurveyJS
ElementFactory.Instance.registerElement(
    CUSTOM_TYPE,
    (name) => new QuestionPreferenceBoardModel(name)
);

// Add the custom question type to the SurveyJS serializer
Serializer.addClass(
    CUSTOM_TYPE,
    [{ name: "positions", default: [] }],
    () => new QuestionPreferenceBoardModel(""),
    "question"
);

// SurveyJS React wrapper for the custom drag/drop board
class SurveyQuestionPreferenceBoard extends SurveyQuestionElementBase {
    get question(): QuestionPreferenceBoardModel {
        return this.questionBase as QuestionPreferenceBoardModel;
    }
    renderElement() {
        return <PreferenceBoard question={this.question} />;
    }
}

// Register the React component for the custom question type
ReactQuestionFactory.Instance.registerQuestion(
    CUSTOM_TYPE,
    (props) => React.createElement(SurveyQuestionPreferenceBoard, props)
);

// The actual custom component
function PreferenceBoard(props: any) {
    const { question } = props;
    // Positions available for ranking
    const positions = React.useMemo(() => question.positions || [], [question.positions]);
    // Tracks which items are expanded (duties, qualifications, hours info visible)
    const [expanded, setExpanded] = React.useState<Set<string>>(new Set());

    // Board state, which positions are in which region, either we pull prefilled data from
    // the database if available or we use the default all -1 (Unwilling) state
    const [boardState, setBoardState] = React.useState<Record<number, string[]>>(
        () =>
            question.value
                ? getBoardStateFromValue(question.value, positions)
                : getInitialBoardState(positions)
    );

    // Sync board state if question value changes externally
    React.useEffect(() => {
        // If question.value changes externally, update board state
        if (question.value) {
            setBoardState(getBoardStateFromValue(question.value, positions));
        }
    }, [question.value, positions]);

    // Toggle expanded/collapsed state for a position item
    function handleCollapseToggle(code: string) {
        setExpanded(prev => {
            const next = new Set(prev);
            if (next.has(code)) {
                next.delete(code);
            } else {
                next.add(code);
            }
            return next;
        });
    }

    // Handle drag-and-drop events
    function onDragEnd(result: any) {
        if (!result.destination) return;
        const destLevel = Number(result.destination.droppableId);
        const destCapacity = PREFERENCE_REGIONS.find(r => r.level === destLevel)?.capacity ?? Infinity;
        if (boardState[destLevel].length >= destCapacity) return;

        const newState = moveItem(boardState, result.source, result.destination);
        setBoardState(newState);
        question.value = getValueFromBoardState(newState);

        // Collapse the dragged item if it was expanded
        const draggedCode = boardState[Number(result.source.droppableId)][result.source.index];
        setExpanded(prev => {
            const next = new Set(prev);
            next.delete(draggedCode);
            return next;
        });
    }

    return (
        <Box sx={{ width: "100%", mx: "auto", minWidth: 0 }}>
            <DragDropContext onDragEnd={onDragEnd}>
                <Box sx={{ display: "flex", flexDirection: "column", width: "100%", minWidth: 0 }}>
                    {PREFERENCE_REGIONS.map(region => {
                        const isFinite = Number.isFinite(region.capacity);
                        const count = boardState[region.level].length;
                        const atCapacity = isFinite && count >= region.capacity;
                        return (
                            <Box
                                key={region.level}
                                sx={{
                                    width: "100%",
                                    minWidth: 0,
                                    mb: 1.5,
                                    mr: 4,
                                    background: region.background,
                                    borderLeft: `6px solid ${region.borderLeft}`,
                                    border: atCapacity ? "2px solid #dc4633" : "1px solid #ccc",
                                    boxShadow: 0,
                                    transition: "border 0.2s",
                                    display: "flex",
                                    flexDirection: "column",
                                }}
                            >
                                {/* Region header: label and counter */}
                                <Box
                                    sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        fontWeight: "bold",
                                        px: 2,
                                        py: 1,
                                        borderBottom: "1px solid #ddd",
                                        borderTopLeftRadius: 6,
                                        borderTopRightRadius: 6,
                                        width: "100%",
                                        minWidth: 0,
                                        boxSizing: "border-box",
                                    }}
                                >
                                    <Typography
                                        variant="subtitle2"
                                        sx={{
                                            fontWeight: "bold",
                                            color: region.color,
                                            flex: 1,
                                            textAlign: "left",
                                            minWidth: 0,
                                        }}
                                    >
                                        {region.label}
                                    </Typography>
                                    {isFinite && (
                                        <span style={{
                                            background: atCapacity ? "#dc4633" : "#1e3765",
                                            color: "#fff",
                                            borderRadius: 8,
                                            padding: "2px 10px",
                                            fontWeight: "bold",
                                            fontSize: "0.95em",
                                            marginLeft: 8,
                                            textAlign: "right",
                                            transition: "background 0.2s",
                                            whiteSpace: "nowrap",
                                            boxSizing: "border-box",
                                        }}>
                                            {count}/{region.capacity}
                                        </span>
                                    )}
                                </Box>
                                {/* Droppable destination area for position items */}
                                <Droppable
                                    droppableId={String(region.level)}
                                    isDropDisabled={atCapacity}
                                >
                                    {(provided, snapshot) => (
                                        <Box
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            sx={{
                                                minHeight: 40,
                                                background: snapshot.isDraggingOver && !atCapacity
                                                    ? "#e3f2fd"
                                                    : region.background,
                                                borderRadius: 0,
                                                borderBottomLeftRadius: 6,
                                                borderBottomRightRadius: 6,
                                                py: 1,
                                                transition: "background 0.2s",
                                                alignSelf: "stretch",
                                                boxSizing: "border-box",
                                            }}
                                        >
                                            {boardState[region.level].map((posId, idx) => {
                                                const pos = positions.find((c: any) => c.id === posId);
                                                const isOpen = expanded.has(posId);
                                                return (
                                                    <Draggable draggableId={String(posId)} index={idx} key={posId}>
                                                        {(provided, snapshot) => (
                                                            <div
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                style={{
                                                                    ...provided.draggableProps.style,
                                                                    marginBottom: 4,
                                                                }}
                                                            >
                                                                {/* Draggable position card */}
                                                                <Paper
                                                                    elevation={isOpen ? 4 : 1}
                                                                    sx={{
                                                                        background: snapshot.isDragging ? "#e3f2fd" : "#fff",
                                                                        borderLeft: `6px solid ${region.borderLeft}`,
                                                                        borderRadius: 4,
                                                                        mb: 0.5,
                                                                        mx: 1,
                                                                        transition: "background 0.2s",
                                                                        alignSelf: "stretch",
                                                                        boxSizing: "border-box",
                                                                    }}
                                                                >
                                                                    {/* Position summary and expand/collapse section */}
                                                                    <Box
                                                                        {...provided.dragHandleProps}
                                                                        sx={{
                                                                            display: "flex",
                                                                            alignItems: "center",
                                                                            cursor: "grab",
                                                                            p: 1,
                                                                            width: "100%",
                                                                            minWidth: 0,
                                                                        }}
                                                                        onClick={() => handleCollapseToggle(posId)}
                                                                    >
                                                                        <ExpandMoreIcon
                                                                            sx={{
                                                                                mr: 1,
                                                                                transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                                                                                transition: "transform 0.2s"
                                                                            }}
                                                                        />
                                                                        <Typography
                                                                            sx={{
                                                                                wordBreak: "break-word",
                                                                                whiteSpace: "normal",
                                                                                display: "block",
                                                                                flex: 1,
                                                                                minWidth: 0,
                                                                                pr: 2,
                                                                            }}
                                                                        >
                                                                            {pos.text}
                                                                        </Typography>
                                                                    </Box>
                                                                    {/* Expanded details */}
                                                                    <Collapse in={isOpen}>
                                                                        <Box sx={{ p: 2, width: "100%", minWidth: 0 }}>
                                                                            <Typography
                                                                                variant="body2"
                                                                                sx={{
                                                                                    wordBreak: "break-word",
                                                                                    whiteSpace: "normal",
                                                                                    width: "100%",
                                                                                    minWidth: 0,
                                                                                    display: "block",
                                                                                    pr: 2,
                                                                                }}
                                                                            >
                                                                                <b>Hours per assignment:</b> {pos.hours_per_assignment || "N/A"}<br/><br/>
                                                                                <b>Duties:</b> {pos.duties || "N/A"}<br /><br />
                                                                                <b>Qualifications:</b> {pos.qualifications || "N/A"}
                                                                            </Typography>
                                                                        </Box>
                                                                    </Collapse>
                                                                </Paper>
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                );
                                            })}
                                            {provided.placeholder}
                                        </Box>
                                    )}
                                </Droppable>
                            </Box>
                        );
                    })}
                </Box>
            </DragDropContext>
        </Box>
    );
}

// --- End of Position Preferences Custom Drag/Drop Board Component ---

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
                item.name === "position_preferences" &&
                Array.isArray(item.positions) &&
                item.positions.length > 0
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

export default function PostingView() {
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

    // Fetch the survey JSON and prefilled data from the backend
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
                } = await apiGET(`/external/postings/${url_token}`, true);
                setSurveyJson(details.survey);
                setSurveyPrefilledData(details.prefilled_data);
                setApplicationOpen(details.open_status);
            } catch (e) {
                console.warn(e);
            }
        }
        fetchSurvey();
    }, [url_token, setSurveyJson, setSurveyPrefilledData, setApplicationOpen]);

    // Render the survey model using the retrieved survey JSON and prefilled data
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

    // Show survey submit confirmation dialog on completion
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

    // Handle survey results submission back to the backend for processing
    async function confirmClicked() {
        console.log("Submitting data", surveyData);
        try {
            setWaiting(true);
            await apiPOST(
                `/external/postings/${url_token}/submit`,
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
