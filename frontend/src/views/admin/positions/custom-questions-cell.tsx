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
import { upsertPosition } from "../../../api/actions";
import { CustomQuestions, Position } from "../../../api/defs/types";
import { 
    areAllQuestionsNonEmpty,
    isQuestionsFieldInValidFormat,
    emptyCustomQuestions
} from "../../../components/custom-question-utils";

function EditCustomQuestionsDialog({
    position,
    open,
    onHide,
    onChange,
}: {
    position: Position;
    open: boolean;
    onHide: () => void;
    onChange: (newQuestions: CustomQuestions, oldQuestions: CustomQuestions) => Promise<void>;
}) {
    const value = position.custom_questions || emptyCustomQuestions;
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
            <DialogTitle>Edit Custom Questions for {position.position_code}</DialogTitle>
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
                                        setFieldVal({
                                            ...fieldVal,
                                            elements: fieldVal.elements.map((q, i) =>
                                                i === index ? { ...q, name: e.target.value } : q
                                            ),
                                        });
                                    }}
                                />
                                <IconButton
                                    color="info"
                                    onClick={() => {
                                        setFieldVal({
                                            ...fieldVal,
                                            elements: fieldVal.elements.filter((_, i) => i !== index),
                                        });
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
                                setFieldVal({
                                    ...fieldVal,
                                    elements: [
                                        ...((fieldVal?.elements ?? [])),
                                        { type: "comment", name: "" },
                                    ],
                                });
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
    showVertically = false,
}: {
    row: { original: Position };
    showVertically?: boolean;
}) {
    const position = row.original;
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const dispatch = useThunkDispatch();

    const handleSave = async (newCustomQuestions: CustomQuestions) => {
        await dispatch(
            upsertPosition({
                id: position.id,
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
            {isQuestionsFieldInValidFormat(position?.custom_questions) ? (
                <>
                    <Box sx={{ flexGrow: 1 }}>
                        {showVertically ? (
                            <ul style={{ margin: 0, paddingLeft: 16 }}>
                                {position?.custom_questions?.elements.map((q, i) => (
                                    <li key={i}>{q.name}</li>
                                ))}
                            </ul>
                        ) : (
                            <Typography variant="body2">
                                {position?.custom_questions?.elements.map((q) => q.name).join(", ")}
                            </Typography>
                        )}
                    </Box>
                    <IconButton
                        size="small"
                        onClick={() => setDialogOpen(true)}
                        title="Edit the custom questions for this position"
                    >
                        <EditIcon fontSize="small" />
                    </IconButton>
                    <EditCustomQuestionsDialog
                        position={position}
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
