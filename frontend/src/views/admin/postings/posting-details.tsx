import React from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { useParams } from "react-router";
import {
    Alert,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import LinkIcon from "@mui/icons-material/Link";

import {
    activeSessionSelector,
    fetchPostingPositionsForPosting,
    fetchPostings,
    postingsSelector,
} from "../../../api/actions";
import { ContentArea } from "../../../components/layout";
import { Posting, Session } from "../../../api/defs/types";
import {
    ActionHeader,
    ActionsList,
    ActionButton,
} from "../../../components/action-buttons";
import { MissingActiveSessionWarning } from "../../../components/sessions";
import { useThunkDispatch } from "../../../libs/thunk-dispatch";
import { ConnectedPostingDetailsView } from "./posting-details/details-view";
import { ConnectedExportPostingsAction } from "./import-export";

function PostingLinkDialog({
    posting,
    visible,
    onHide,
}: {
    posting: Posting;
    visible: boolean;
    onHide: (...args: any[]) => void;
}) {
    let urlString: string;
    if (process.env.REACT_APP_DEV_FEATURES) {
        // In development mode, use hash routing as a string
        urlString = `${window.location.origin}/#/public/postings/${posting.url_token}`;
    } else {
        // In production, use the /hash route
        urlString = `${window.location.origin}/hash/public/postings/${posting.url_token}`;
    }

    let warning = null;
    if (posting.posting_positions.length === 0) {
        warning = (
            <Alert severity="warning" sx={{ mb: 2 }}>
                This posting has no associated positions, which means applicants
                cannot currently complete an application.
            </Alert>
        );
    }

    return (
        <Dialog open={visible} onClose={onHide} maxWidth="md" fullWidth>
            <DialogTitle sx={{ m: 0, p: 2 }}>
                Posting URL
                <IconButton
                    aria-label="close"
                    onClick={onHide}
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
                {warning}
                <Typography variant="body1">
                    You can distribute the following link to give access to the posting <em>{posting.name}</em>
                </Typography>
                <Typography variant="body1" sx={{ mt: 1 }}>
                    <a href={urlString}>{urlString}</a>
                </Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={onHide} variant="contained" color="secondary">
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
}

function ConnectedPostingDetails() {
    const activeSession = useSelector(activeSessionSelector) as Session | null;
    const postings = useSelector(postingsSelector);
    const dispatch = useThunkDispatch();
    const [urlDialogVisible, setUrlDialogVisible] = React.useState(false);
    const [postingIsForDifferentSession, setPostingIsForDifferentSession] =
        React.useState(false);

    const params = useParams<{ posting_id?: string }>();
    const posting_id =
        params.posting_id != null ? parseInt(params.posting_id, 10) : null;

    // We don't load postings by default, so we load them dynamically whenever
    // we view this page.
    React.useEffect(() => {
        async function fetchResources() {
            try {
                const posting = { id: posting_id || 0 };
                const postings = await dispatch(fetchPostings());
                // If we are viewing a posting for a different session, we want to route
                // back to the overview page instead of continuing.
                if (!postings.some((p) => p.id === posting.id)) {
                    setPostingIsForDifferentSession(true);
                    return;
                } else {
                    setPostingIsForDifferentSession(false);
                }
                await dispatch(fetchPostingPositionsForPosting(posting));
            } catch (e) {}
        }

        if (activeSession && posting_id != null) {
            fetchResources();
        }
    }, [activeSession, posting_id, dispatch]);

    const posting = postings.find((posting) => posting.id === posting_id);

    if (postingIsForDifferentSession) {
        return <Navigate to="/postings/overview" replace />;
    }

    if (posting_id == null) {
        return (
            <div className="page-body">
                <ContentArea>
                    <Typography variant="h4" color="error">
                        Cannot view a Posting without a valid posting id
                    </Typography>
                </ContentArea>
            </div>
        );
    }

    if (posting == null) {
        return (
            <div className="page-body">
                <ContentArea>
                    <Typography variant="h4" color="error">
                        Cannot find Posting with id={posting_id}
                    </Typography>
                </ContentArea>
            </div>
        );
    }

    let warning = null;
    if (posting.posting_positions.length === 0) {
        warning = (
            <Alert severity="warning">
                This posting has no associated positions, which means applicants
                cannot currently complete an application.
            </Alert>
        );
    }

    return (
        <div className="page-body">
            <ActionsList>
                <ActionHeader>Available Actions</ActionHeader>
                <ActionButton
                    onClick={() => setUrlDialogVisible(true)}
                    icon={<LinkIcon />}
                >
                    Get Link to Posting
                </ActionButton>
                <ActionHeader>Import/Export</ActionHeader>
                <ConnectedExportPostingsAction postingId={posting_id} />
            </ActionsList>
            <ContentArea>
                {activeSession ? null : (
                    <MissingActiveSessionWarning extraText="To view, modify, or create postings, you must select a session." />
                )}
                {warning}
                <ConnectedPostingDetailsView posting={posting} />
            </ContentArea>
            <PostingLinkDialog
                posting={posting}
                visible={urlDialogVisible}
                onHide={() => setUrlDialogVisible(false)}
            />
        </div>
    );
}

export { ConnectedPostingDetails as PostingDetails };
