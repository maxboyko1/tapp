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
    Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import UploadIcon from "@mui/icons-material/Upload";

import { ActionButton } from "../../../components/action-buttons";
import { uploadLetterTemplate } from "../../../api/actions";
import { useThunkDispatch } from "../../../libs/thunk-dispatch";

export function ConnectedUploadLetterTemplateAction({ disabled = false }) {
    const dispatch = useThunkDispatch();
    const [file, setFile] = React.useState<File | null>(null);
    const [fileInputLabel, setFileInputLabel] = React.useState(
        "Select an HTML template file."
    );
    const [dialogOpen, setDialogOpen] = React.useState<boolean>(false);
    const [inProgress, setInProgress] = React.useState(false);

    async function _onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
        if (event?.target?.files) {
            const file = event.target.files[0];
            setFile(file);
            setFileInputLabel(file.name);
        } else {
            setFile(null);
        }
    }

    async function onConfirm() {
        if (file) {
            setInProgress(true);
            try {
                await dispatch(uploadLetterTemplate(file));
            } finally {
                setInProgress(false);
            }
        }

        onCancel();
    }
    function onCancel() {
        setDialogOpen(false);
        setFileInputLabel("Select an HTML template file.");
        setFile(null);
    }

    // When a confirm operation is in progress, a spinner is displayed; otherwise
    // it's hidden
    const spinner = inProgress ? (
        <CircularProgress size={18} sx={{ mr: 1 }} />
    ) : null;

    return (
        <>
            <ActionButton
                icon={<UploadIcon />}
                onClick={() => setDialogOpen(true)}
                disabled={disabled}
            >
                Upload Letter Template
            </ActionButton>
            <Dialog
                open={dialogOpen}
                onClose={onCancel}
                maxWidth="lg"
                fullWidth
            >
                <DialogTitle sx={{ m: 0, p: 2 }}>
                    Upload Letter Template
                    <IconButton
                        aria-label="close"
                        onClick={onCancel}
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
                    <Box sx={{ mb: 3 }}>
                        <Button
                            variant="outlined"
                            component="label"
                            startIcon={<UploadIcon />}
                            fullWidth
                        >
                            {fileInputLabel}
                            <input
                                type="file"
                                hidden
                                onChange={_onFileChange}
                            />
                        </Button>
                    </Box>
                    <Typography variant="body2" color="textSecondary">
                        A template is an HTML file with special substitution strings (words surrounded by {"{{"} and {"}}"}) that will be replaced with appointment-specific values when rendered as a contract.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button variant="contained" color="secondary" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        disabled={!file}
                        title={
                            file
                                ? `Upload '${fileInputLabel}' to TAPP`
                                : "You must select a file to upload."
                        }
                        onClick={onConfirm}
                        startIcon={spinner || <UploadIcon />}
                    >
                        Upload
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
