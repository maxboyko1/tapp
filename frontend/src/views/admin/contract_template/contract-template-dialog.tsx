import React from "react";
import { useSelector } from "react-redux";
import {
    Alert,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import {
    contractTemplatesSelector,
    allContractTemplatesSelector,
    upsertContractTemplate,
    fetchAllContractTemplates,
} from "../../../api/actions";
import { strip } from "../../../libs/utils";
import { ContractTemplateEditor } from "../../../components/forms/contract-template-editor";
import { ContractTemplate } from "../../../api/defs/types";
import { useThunkDispatch } from "../../../libs/thunk-dispatch";
import { PropsForElement } from "../../../api/defs/types/react";

const BLANK_CONTRACT_TEMPLATE = {
    template_name: "",
    template_file: "",
};

/**
 * Find if there is a conflicting instructor in the passed in list
 * of instructors, or if any required fields are incorrect.
 *
 * @param {object} contractTemplate
 * @param {object[]} contractTemplates
 */
function getConflicts(
    contractTemplate: Partial<ContractTemplate>,
    contractTemplates: ContractTemplate[]
) {
    const ret: { delayShow: string; immediateShow: React.ReactNode } = {
        delayShow: "",
        immediateShow: "",
    };
    if (
        !strip(contractTemplate.template_name) ||
        !strip(contractTemplate.template_file)
    ) {
        ret.delayShow = "A template name and template file is required";
    }
    const matchingTemplate = contractTemplates.find(
        (x) => strip(x.template_name) === strip(contractTemplate.template_name)
    );
    if (matchingTemplate) {
        ret.immediateShow = (
            <Typography variant="body2" color="error">
                <p>
                    Another contract template exists with name=
                    {contractTemplate.template_name}:{" "}
                    <b>
                        {matchingTemplate.template_name}{" "}
                        {matchingTemplate.template_file}
                    </b>
                </p>
            </Typography>
        );
    }
    return ret;
}

function AddContractTemplateDialog(props: {
    show: boolean;
    onHide: (...args: any[]) => void;
    contractTemplates: ContractTemplate[];
    upsertContractTemplate: (template: Partial<ContractTemplate>) => any;
    fetchAllContractTemplates: (...args: any[]) => any;
    availableTemplates: { template_file: string }[];
}) {
    const {
        show,
        onHide = () => {},
        contractTemplates,
        availableTemplates,
        upsertContractTemplate,
        fetchAllContractTemplates,
    } = props;
    const [newContractTemplate, setNewContractTemplate] = React.useState<
        Partial<ContractTemplate>
    >(BLANK_CONTRACT_TEMPLATE);

    React.useEffect(() => {
        if (!show) {
            // If the dialog is hidden, reset the state
            setNewContractTemplate(BLANK_CONTRACT_TEMPLATE);
        } else {
            // If we've just become visible, fetch all available contract templates
            fetchAllContractTemplates();
        }
    }, [show, fetchAllContractTemplates]);

    function createContractTemplate() {
        upsertContractTemplate(newContractTemplate);
        onHide();
    }

    const conflicts = getConflicts(newContractTemplate, contractTemplates);

    return (
        <Dialog open={show} onClose={onHide} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ m: 0, p: 2 }}>
                Add Contract Template
                <IconButton
                    aria-label="close"
                    onClick={onHide}
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
                <ContractTemplateEditor
                    contractTemplate={newContractTemplate}
                    setContractTemplate={setNewContractTemplate}
                    availableTemplates={availableTemplates}
                />
                {conflicts.immediateShow ? (
                    <Box mt={2}>
                        <Alert severity="error">{conflicts.immediateShow}</Alert>
                    </Box>
                ) : null}
            </DialogContent>
            <DialogActions>
                <Button onClick={onHide} variant="contained" color="secondary">
                    Cancel
                </Button>
                <Button
                    onClick={createContractTemplate}
                    title={conflicts.delayShow || "Create Contract Template"}
                    disabled={!!conflicts.delayShow || !!conflicts.immediateShow}
                    variant="contained"
                    color="primary"
                >
                    Create Contract Template
                </Button>
            </DialogActions>
        </Dialog>
    );
}

/**
 * AddContractTemplateDialog that has been connected to the redux store
 */
export function ConnectedAddContractTemplateDialog(
    props: Pick<
        PropsForElement<typeof AddContractTemplateDialog>,
        "show" | "onHide"
    >
) {
    const contractTemplates = useSelector(contractTemplatesSelector);
    const availableTemplates = useSelector(allContractTemplatesSelector);
    const dispatch = useThunkDispatch();
    const _upsertContractTemplate = React.useCallback(
        (template: Partial<ContractTemplate>) => dispatch(upsertContractTemplate(template)),
        [dispatch]
    );
    const _fetchAllContractTemplates = React.useCallback(
        () => dispatch(fetchAllContractTemplates()),
        [dispatch]
    );
    return (
        <AddContractTemplateDialog
            contractTemplates={contractTemplates}
            availableTemplates={availableTemplates}
            upsertContractTemplate={_upsertContractTemplate}
            fetchAllContractTemplates={_fetchAllContractTemplates}
            {...props}
        />
    );
}
