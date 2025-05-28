import React from "react";
import { useSelector } from "react-redux";
import FileSaver from "file-saver";
import { MRT_Row } from "material-react-table";
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
    Tooltip,
    Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import SearchIcon from "@mui/icons-material/Search";

import {
    contractTemplatesSelector,
    previewContractTemplate,
    downloadContractTemplate,
    upsertContractTemplate,
} from "../../../api/actions";
import { ContractTemplatesList } from "../../../components/contract-templates-list";
import { useThunkDispatch } from "../../../libs/thunk-dispatch";
import { ContractTemplate } from "../../../api/defs/types";
import { AdvancedColumnDef } from "../../../components/advanced-filter-table";

function TemplatePreviewDialog({
    show,
    onClose,
    template_id,
}: {
    show: boolean;
    onClose: (...args: any[]) => void;
    template_id: number | null;
}) {
    const [isLoading, setIsLoading] = React.useState(false);
    const [cachedPreview, setCachedPreview] = React.useState<{
        id: number | null;
        content: string | null;
    }>({
        id: null,
        content: null,
    });
    const dispatch = useThunkDispatch();

    React.useEffect(() => {
        if (
            // Don't try to load an invalid template
            template_id == null ||
            // Don't reload a template that we've already loaded
            template_id === cachedPreview.id
        ) {
            setIsLoading(false);
            return;
        }

        // We're loading a template that we haven't loaded yet.
        setIsLoading(true);
        dispatch(previewContractTemplate(template_id))
            .then((content) => {
                setCachedPreview({ id: template_id, content });
            })
            .finally(() => setIsLoading(false));
    }, [template_id, setIsLoading, cachedPreview.id, dispatch]);

    async function downloadClicked() {
        if (template_id == null) {
            return;
        }
        const file = await dispatch(downloadContractTemplate(template_id));
        FileSaver.saveAs(file);
    }

    return (
        <Dialog
            open={show}
            onClose={onClose}
            maxWidth="xl"
            fullWidth
            slotProps={{ paper: { sx: { minHeight: "80vh" } }}}
        >
            <DialogTitle sx={{ m: 0, p: 2 }}>
                Previewing Template
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
            <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Typography variant="body1" sx={{ mb: 2 }}>
                    The template you are previewing has its fields filled in with dummy values. These values will be replaced with correct values when the template is used to create a contract.
                </Typography>
                {isLoading && (
                    <Alert severity="info" sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                        <CircularProgress size={20} sx={{ mr: 2 }} />
                        Loading Template...
                    </Alert>
                )}
                {template_id != null && !isLoading && (
                    <Box sx={{ flexGrow: 1, display: "flex" }}>
                        <iframe
                            style={{
                                border: "1px solid black",
                                width: "100%",
                                flexGrow: 1,
                                minHeight: "60vh",
                            }}
                            srcDoc={cachedPreview.content || undefined}
                            title="Contract template preview"
                        />
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button
                    title="Download a copy of this template. The downloaded copy will have no substitutions made and will be suitable for editing."
                    onClick={downloadClicked}
                    variant="text"
                    startIcon={<DownloadIcon sx={{ mr: 1 }} />}
                >
                    Download Template
                </Button>
                <Button variant="outlined" color="secondary" onClick={onClose}>
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export function ConnectedContractTemplateList() {
    const [previewVisible, setPreviewVisible] = React.useState(false);
    const [previewingTemplate, setPreviewingTemplate] = React.useState<
        number | null
    >(null);
    const contractTemplates = useSelector(contractTemplatesSelector);
    const dispatch = useThunkDispatch();

    const columns: AdvancedColumnDef<ContractTemplate>[] = [
        { 
            header: "Template Name", 
            accessorKey: "template_name",
            size: 200,
            meta: { editable: true },
        },
        {
            header: "Template File",
            accessorKey: "template_file",
            Cell: TemplateFileCell,
            size: 400,
        },
    ];

    function handleEditRow(original: ContractTemplate, values: Partial<ContractTemplate>) {
        const newTemplate = { ...original, ...values };
        dispatch(upsertContractTemplate(newTemplate));
    }

    function TemplateFileCell({ row }: { row: MRT_Row<ContractTemplate> }) {
        const rowData = row.original;
        const template_id = rowData.id;
        const template_file = rowData.template_file;

        return (
            <span style={{ display: "flex", alignItems: "center" }}>
                <Tooltip title="Preview Template">
                    <IconButton
                        size="small"
                        sx={{ mr: 1, py: 0 }}
                        onClick={() => previewClicked(template_id)}
                    >
                        <SearchIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                {template_file}
            </span>
        );
    }

    function previewClicked(template_id: number) {
        setPreviewingTemplate(template_id);
        setPreviewVisible(true);
    }

    return (
        <>
            <ContractTemplatesList
                contractTemplates={contractTemplates}
                columns={columns}
                onEditRow={handleEditRow}
            />
            <TemplatePreviewDialog
                show={previewVisible}
                onClose={() => setPreviewVisible(false)}
                template_id={previewingTemplate}
            />
        </>
    );
}
