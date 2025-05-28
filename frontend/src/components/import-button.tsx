import React, { useState } from "react";
import * as XLSX from "xlsx";
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import UploadIcon from "@mui/icons-material/Upload";

import { ActionButton } from "./action-buttons";
import { DataFormat } from "../libs/import-export";

interface ImportButtonProps {
    onFileChange: (file: DataFormat | null) => any;
    onConfirm: (file: DataFormat | null) => any;
    dialogContent: React.ReactElement;
}

const DEFAULT_LABEL = "Select a spreadsheet, CSV, or JSON file.";

/**
 * A dialog for handling file input. The work of showing validation/content is handled by `dialogContent`.
 * This component handles displaying and parting a file specified by an <input type="file" /> node.
 *
 * @param {*} {
 *     dialogOpen,
 *     onCancel,
 *     onClose,
 *     onConfirm,
 *     dialogContent,
 *     onFileChange,
 * } - `onCancel` means the cancel button was clicked. `onClose` means the `x` was clicked or there was a click outside of the dialog window.
 * @returns
 */
export function ImportDialog({
    dialogOpen,
    onCancel,
    onClose,
    onConfirm,
    dialogContent,
    onFileChange,
    setInProgress: parentSetInProgress,
    label = DEFAULT_LABEL,
}: ImportButtonProps & {
    dialogOpen: boolean;
    onCancel: Function;
    onClose: (...args: any[]) => void;
    setInProgress: Function;
    label?: string;
}) {
    const [fileInputLabel, setFileInputLabel] = React.useState(label);
    const [fileArrayBuffer, setFileArrayBuffer] =
        React.useState<ArrayBuffer | null>(null);
    const [fileContents, setFileContents] = React.useState<DataFormat | null>(
        null
    );
    const [inProgress, _setInProgress] = React.useState(false);

    let formElement = null;

    const withLabelReset = (actionHandler: typeof onCancel) => () => {
        setFileInputLabel(DEFAULT_LABEL);
        actionHandler();
    };

    const withFileContentsReset = (actionHandler: typeof onCancel) => () => {
        setFileContents(null);
        setFileArrayBuffer(null);
        actionHandler();
    };

    // When we are processing we want to set a spinner button
    // in the dialog as well as communicate to our parent
    // that we are in the midst of processing. Therefore, we
    // call both the internal `setInProgress` function as well
    // as the one from our parent.
    function setInProgress(val: boolean) {
        _setInProgress(val);
        if (typeof parentSetInProgress === "function") {
            parentSetInProgress(val);
        }
    }

    if (!(onCancel instanceof Function)) {
        onCancel = () => console.warn("No onCancel function set for dialog");
    }

    // When file contents changes
    React.useEffect(() => {
        if (!fileContents) {
            return;
        }
        if (onFileChange instanceof Function) {
            onFileChange(fileContents);
        }
    }, [fileContents, onFileChange, formElement]);

    // Wrap the <input type="file" /> in an effect that parses the file
    React.useEffect(() => {
        if (!fileArrayBuffer) {
            return;
        }

        // Attempt to decode the file as JSON. If that doesn't work,
        // we process it as a spreadsheet.

        const rawData = new Uint8Array(fileArrayBuffer);
        try {
            const str = new TextDecoder().decode(rawData);
            setFileContents({ data: JSON.parse(str), fileType: "json" });
            return;
            // eslint-disable-next-line
        } catch (e) {}
        try {
            const workbook = XLSX.read(rawData, { type: "array" });
            const firstSheet = workbook.SheetNames[0];
            setFileContents({
                data: XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet]),
                fileType: "spreadsheet",
            });
            return;
            // eslint-disable-next-line
        } catch (e) {}

        console.warn(
            "Could not determine file type for",
            fileInputLabel,
            fileArrayBuffer
        );
    }, [fileArrayBuffer, fileInputLabel]);

    function _onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
        if (!event.target || !event.target.files) {
            return;
        }
        const file = event.target.files[0];
        setFileInputLabel(file.name);

        const reader = new FileReader();
        reader.onload = (e) => {
            if (!e.target || typeof e.target.result === "string") {
                console.warn(
                    "File of unexpected type",
                    typeof e.target?.result
                );
                return;
            }
            setFileArrayBuffer(e.target.result);
        };
        reader.readAsArrayBuffer(file);
    }

    function _onConfirm() {
        if (!(onConfirm instanceof Function)) {
            return;
        }
        setInProgress(true);
        // We wrap `onConfirm` in an async function which will automatically
        // convert it to a promise if needed.
        (async () => onConfirm(fileContents))()
            .then(() => {
                setInProgress(false);
            })
            .catch(console.error)
            .finally(() => {
                setInProgress(false);
                setFileArrayBuffer(null);
                setFileContents(null);
                setFileInputLabel(label);
            });
    }

    // When a confirm operation is in progress, a spinner is displayed; otherwise
    // it's hidden
    const spinner = inProgress ? (
        <CircularProgress size={18} sx={{ mr: 1 }} />
    ) : null;

    return (
        <Dialog
            open={dialogOpen}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            slotProps={{ paper: { className: "wide-modal" }}}
        >
            <DialogTitle sx={{ m: 0, p: 2 }}>
                Import From File
                <IconButton
                    aria-label="close"
                    onClick={onClose}
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
                    <Alert severity="info" sx={{ mb: 1 }}>
                        <strong>Note:</strong> For spreadsheet imports, ensure that all rows in your spreadsheet
                        {" "}<i>after</i>{" "} the ones with data you are trying to import are cleared, because
                        the validator may interpret these as malformed/incomplete data rows and give you an error.
                        This may even be a result of rows in your file that visually appear to be empty,
                        but in fact are not. To be safe, select all cells in your spreadsheet and hit Delete
                        (or similar) to clear them and save, then you should be able to proceed with your import.
                    </Alert>
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
                <Box sx={{ mb: 2 }}>
                    {dialogContent}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button
                    variant="contained"
                    color="secondary"
                    onClick={withLabelReset(withFileContentsReset(onCancel))}
                >
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={_onConfirm}
                    startIcon={spinner}
                >
                    Confirm
                </Button>
            </DialogActions>
        </Dialog>
    );
}

/**
 * Renders an dropdown import button component that imports data from file.
 * When clicked, a dialog is opened where a user can select a file to import.
 *
 * @param onFileChange - function called when a file is selected. Do any processing or validation in response to this callback.
 * @param dialogContent - Content of the dialog to be show. Can be a preview of the data or a validation message.
 * @param onConfirm - Called when the "Confirm" button is pressed. Can be an async function. If so, a spinner will be displayed between the time "Confirm" is pressed and the time `onConfirm` finishes executing.
 */
export function ImportButton({
    onFileChange,
    dialogContent,
    onConfirm,
    setInProgress,
}: ImportButtonProps & { setInProgress: Function; disabled?: boolean }) {
    const [dialogOpen, setDialogOpen] = useState(false);

    /**
     * closes the dialog by setting dialogOpen to false
     */
    function handleClose() {
        setDialogOpen(false);
    }

    function onCancel() {
        onFileChange(null);
        handleClose();
    }

    async function _onConfirm(...args: [DataFormat | null]) {
        await onConfirm(...args);
        setDialogOpen(false);
    }

    return (
        <>
            <Button
                variant="contained"
                color="primary"
                onClick={() => setDialogOpen(true)}
            >
                Import
            </Button>
            <ImportDialog
                dialogOpen={dialogOpen}
                onCancel={onCancel}
                onClose={handleClose}
                onFileChange={onFileChange}
                dialogContent={dialogContent}
                onConfirm={_onConfirm}
                setInProgress={setInProgress}
            />
        </>
    );
}

/**
 * Renders an dropdown import button component that imports data from file.
 * When clicked, a dialog is opened where a user can select a file to import.
 *
 * @param onFileChange - function called when a file is selected. Do any processing or validation in response to this callback.
 * @param dialogContent - Content of the dialog to be show. Can be a preview of the data or a validation message.
 * @param onConfirm - Called when the "Confirm" button is pressed. Can be an async function. If so, a spinner will be displayed between the time "Confirm" is pressed and the time `onConfirm` finishes executing.
 */
export function ImportActionButton({
    onFileChange,
    dialogContent,
    onConfirm,
    setInProgress,
    disabled = false,
}: ImportButtonProps & { setInProgress: Function; disabled?: boolean }) {
    const [dialogOpen, setDialogOpen] = useState(false);

    /**
     * closes the dialog by setting dialogOpen to false
     */
    function handleClose() {
        setDialogOpen(false);
    }

    function onCancel() {
        onFileChange(null);
        handleClose();
    }

    async function _onConfirm(...args: [DataFormat | null]) {
        await onConfirm(...args);
        setDialogOpen(false);
    }

    return (
        <>
            <ActionButton
                icon={<UploadIcon />}
                onClick={() => setDialogOpen(true)}
                disabled={disabled}
            >
                Import
            </ActionButton>
            <ImportDialog
                dialogOpen={dialogOpen}
                onCancel={onCancel}
                onClose={handleClose}
                onFileChange={onFileChange}
                dialogContent={dialogContent}
                onConfirm={_onConfirm}
                setInProgress={setInProgress}
            />
        </>
    );
}
