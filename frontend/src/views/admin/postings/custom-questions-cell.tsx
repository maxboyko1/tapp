import React from "react";
import {
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    TextField,
    Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";

import { useThunkDispatch } from "../../../libs/thunk-dispatch";
import { upsertPosting } from "../../../api/actions";
import { CustomQuestions, Posting } from "../../../api/defs/types";
import { 
    areAllQuestionsNonEmpty,
    isQuestionsFieldInValidFormat,
    emptyCustomQuestions
} from "../../../components/custom-question-utils";

function EditCustomQuestionsDialog({
    posting,
    open,
    onHide,
    onChange,
}: {
    posting: Posting;
    open: boolean;
    onHide: () => void;
    onChange: (newQuestions: CustomQuestions, oldQuestions: CustomQuestions) => Promise<void>;
}) {
    const value = posting.custom_questions || emptyCustomQuestions;
    const [fieldVal, setFieldVal] = React.useState(value);
    const [inProgress, setInProgress] = React.useState(false);

    const handleCancel = () => {
        setFieldVal(value);
        onHide();
    };

    const handleSave = async () => {
        if (areAllQuestionsNonEmpty(fieldVal)) {
            setInProgress(true);
            try {
                await onChange(fieldVal, value);
            } finally {
                setInProgress(false);
            }
        }
    };

    return (
        <Dialog open={open} onClose={handleCancel} fullWidth maxWidth="sm">
            <DialogTitle>Edit Custom Questions for {posting.name}</DialogTitle>
            <DialogContent dividers>
                {isQuestionsFieldInValidFormat(fieldVal) ? (
                    <Box display="flex" flexDirection="column" gap={2}>
                        {fieldVal?.elements.map((question, index) => (
                            <Box key={index} display="flex" gap={1} alignItems="center">
                                <TextField
                                    fullWidth
                                    value={question.name}
                                    placeholder="Write your question here..."
                                    onChange={(e) => {
                                        const newQuestions = { ...fieldVal };
                                        newQuestions.elements[index].name = e.target.value;
                                        setFieldVal(newQuestions);
                                    }}
                                />
                                <IconButton
                                    color="info"
                                    onClick={() => {
                                        const newQuestions = { ...fieldVal };
                                        newQuestions.elements.splice(index, 1);
                                        setFieldVal(newQuestions);
                                    }}
                                >
                                    <DeleteIcon />
                                </IconButton>
                            </Box>
                        ))}
                        <Button
                            color="info"
                            variant="outlined"
                            onClick={() => {
                                const newQuestions = {
                                    ...fieldVal,
                                    elements: fieldVal?.elements || [],
                                };
                                newQuestions.elements.push({
                                    type: "comment",
                                    name: "",
                                });
                                setFieldVal(newQuestions);
                            }}
                        >
                            Add Custom Question
                        </Button>
                    </Box>
                ) : (
                    <Typography color="error">
                        (Uneditable, questions in deprecated JSON format)
                    </Typography>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleCancel} color="secondary" variant="contained">
                    Cancel
                </Button>
                <Button
                    onClick={handleSave}
                    variant="contained"
                    disabled={!areAllQuestionsNonEmpty(fieldVal) || inProgress}
                    startIcon={inProgress ? <CircularProgress size={16} /> : null}
                >
                    Save
                </Button> 
            </DialogActions>
        </Dialog>
    );
}

export function EditCustomQuestionsCell({
    row,
    showQuestions = false,
}: {
    row: { original: Posting };
    showQuestions?: boolean;
}) {
    const posting = row.original;
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const dispatch = useThunkDispatch();

    const handleSave = async (newCustomQuestions: CustomQuestions) => {
        await dispatch(
            upsertPosting({
                id: posting.id,
                custom_questions: newCustomQuestions,
            })
        );
        setDialogOpen(false);
    };

    return (
        <Box
            sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1,
                flexWrap: "wrap",
            }}
        >
            {isQuestionsFieldInValidFormat(posting?.custom_questions) ? (
                <>
                    {showQuestions && (
                        <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="body2">
                                {posting?.custom_questions?.elements.map((q) => q.name).join(", ")}
                            </Typography>
                        </Box>
                    )}
                    {showQuestions ? (
                        <IconButton
                            size="small"
                            onClick={() => setDialogOpen(true)}
                            title="Edit the custom questions for this posting"
                        >
                            <EditIcon fontSize="small" />
                        </IconButton>
                    ) : (
                        <Button
                            color="info"
                            size="small"
                            variant="outlined"
                            onClick={() => setDialogOpen(true)}
                        >
                            Edit Custom Questions
                        </Button>
                    )}
                    <EditCustomQuestionsDialog
                        posting={posting}
                        open={dialogOpen}
                        onHide={() => setDialogOpen(false)}
                        onChange={handleSave}
                    />
                </>
            ) : (
                <Typography color="error">
                    (Uneditable, questions in deprecated JSON format)
                </Typography>
            )}
        </Box>
    );
}
