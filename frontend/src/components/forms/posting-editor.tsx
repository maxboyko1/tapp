import React from "react";
import {
    Box,
    Button,
    IconButton,
    Grid,
    TextField,
    Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

import { fieldEditorFactory, DialogRow } from "./common-controls";
import { Posting } from "../../api/defs/types";

export function PostingEditor({
    posting,
    setPosting,
}: {
    posting: Posting;
    setPosting: (position: Posting) => void;
}) {
    const createFieldEditor = fieldEditorFactory(posting, setPosting);

    function addCustomQuestion() {
        const newQuestions = posting.custom_questions ?
            { ...posting.custom_questions } : { elements: [] };
        newQuestions.elements.push({
            type: "comment",
            name: "",
        });
        setPosting({ ...posting, custom_questions: newQuestions });
    }

    function deleteCustomQuestion(index: number) {
        if (posting.custom_questions) {
            const newQuestions = { ...posting.custom_questions };
            newQuestions.elements.splice(index, 1);
            setPosting({ ...posting, custom_questions: newQuestions });
        }
    }

    function updateCustomQuestion(index: number, value: string) {
        if (posting.custom_questions) {
            const newQuestions = { ...posting.custom_questions };
            newQuestions.elements[index].name = value;
            setPosting({ ...posting, custom_questions: newQuestions });
        }
    }

    return (
        <Box component="form" noValidate autoComplete="off">
            <DialogRow>
                {createFieldEditor("Posting Name (e.g. 2019 Fall)", "name")}
            </DialogRow>
            <DialogRow>
                {createFieldEditor("Open Date", "open_date", "date")}
                {createFieldEditor("Close Date", "close_date", "date")}
            </DialogRow>
            <DialogRow>
                {createFieldEditor("Intro Text", "intro_text", "text")}
            </DialogRow>
            <Typography variant="h6" sx={{ mt: 2 }}>
                Posting-Specific Custom Questions
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
                Define your custom questions for this posting in textboxes you can add below. All must be non-empty.
            </Typography>
            <Grid container spacing={2} direction="column">
                {posting.custom_questions?.elements.map((question: { name: string }, index: number) => (
                    <Grid key={index}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <TextField
                                type="text"
                                value={question.name}
                                placeholder="Write your question here..."
                                onChange={(e) => updateCustomQuestion(index, e.target.value)}
                                size="small"
                                fullWidth
                            />
                            <IconButton
                                color="info"
                                onClick={() => deleteCustomQuestion(index)}
                                aria-label="Delete question"
                            >
                                <DeleteIcon />
                            </IconButton>
                        </Box>
                    </Grid>
                ))}
                <Grid>
                    <Button
                        variant="outlined"
                        color="info"
                        onClick={addCustomQuestion}
                    >
                        Add Custom Question
                    </Button>
                </Grid>
            </Grid>
        </Box>
    );
}
