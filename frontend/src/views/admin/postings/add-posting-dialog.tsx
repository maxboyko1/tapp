import React from "react";
import {
    Alert,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
} from "@mui/material";

import { strip } from "../../../libs/utils";
import { useSelector } from "react-redux";
import { upsertPosting, postingsSelector } from "../../../api/actions";
import { Posting } from "../../../api/defs/types";
import { PostingEditor } from "../../../components/forms/posting-editor";
import { areAllQuestionsNonEmpty, emptyCustomQuestions } from "../../../components/custom-question-utils";
import { useThunkDispatch } from "../../../libs/thunk-dispatch";

interface Conflict {
    delayShow: string;
    immediateShow: React.JSX.Element | string;
}

function getConflicts(posting: Partial<Posting>, postings: Posting[] = []) {
    const ret: Conflict = { delayShow: "", immediateShow: "" };
    if (!strip(posting.name)) {
        ret.delayShow = "A name is required.";
    }
    const matchingPosting = postings.find(
        (x) => strip(x.name) === strip(posting.name)
    );
    if (matchingPosting) {
        ret.immediateShow = (
            <p>Another session exists with name={posting.name}</p>
        );
    }
    return ret;
}

const BLANK_POSTING = {
    name: "",
    open_date: "",
    close_date: "",
    intro_text: "",
    custom_questions: emptyCustomQuestions
};

export function ConnectedAddPostingDialog({
    show,
    onHide = () => {},
}: {
    show: boolean;
    onHide: () => any;
}) {
    const [newPosting, setNewPosting] = React.useState(BLANK_POSTING);
    const postings: Posting[] = useSelector(postingsSelector);
    const dispatch = useThunkDispatch();
    async function _upsertPosting(posting: Partial<Posting>) {
        await dispatch(upsertPosting(posting));
    }

    React.useEffect(() => {
        if (!show) {
            // If the dialog is hidden, reset the state
            setNewPosting(BLANK_POSTING);
        }
    }, [show]);

    function createInstructor() {
        _upsertPosting(newPosting);
        onHide();
    }

    const conflicts = getConflicts(newPosting, postings);

    return (
        <Dialog open={show} onClose={onHide} maxWidth="sm" fullWidth>
            <DialogTitle>Add Posting</DialogTitle>
            <DialogContent dividers>
                <PostingEditor
                    posting={newPosting as Posting}
                    setPosting={setNewPosting as any}
                />
                {conflicts.immediateShow ? (
                    <Alert severity="error">{conflicts.immediateShow}</Alert>
                ) : null}
            </DialogContent>
            <DialogActions>
                <Button onClick={onHide} variant="contained" color="secondary">
                    Cancel
                </Button>
                <Button
                    onClick={createInstructor}
                    title={conflicts.delayShow || "Create Session"}
                    disabled={
                        !!conflicts.delayShow ||
                        !!conflicts.immediateShow ||
                        !areAllQuestionsNonEmpty(newPosting.custom_questions)
                    }
                    variant="contained"
                    color="primary"
                >
                    Create Posting
                </Button>
            </DialogActions>
        </Dialog>
    );
}
