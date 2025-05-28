import React from "react";
import { useSelector } from "react-redux";
import {
    Alert,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import {
    letterTemplatesSelector,
    allLetterTemplatesSelector,
    upsertLetterTemplate,
    fetchAllLetterTemplates,
} from "../../../api/actions";
import { strip } from "../../../libs/utils";
import { LetterTemplateEditor } from "../../../components/forms/letter-template-editor";
import { LetterTemplate } from "../../../api/defs/types";
import { useThunkDispatch } from "../../../libs/thunk-dispatch";
import { PropsForElement } from "../../../api/defs/types/react";

const BLANK_LETTER_TEMPLATE = {
    template_name: "",
    template_file: "",
};

/**
 * Check for conflicting letter template names.
 *
 * @param {object} letterTemplate
 * @param {object[]} letterTemplates
 */
function getConflicts(
    letterTemplate: Partial<LetterTemplate>,
    letterTemplates: LetterTemplate[]
) {
    const ret: { delayShow: string; immediateShow: React.ReactNode } = {
        delayShow: "",
        immediateShow: "",
    };
    if (
        !strip(letterTemplate.template_name) ||
        !strip(letterTemplate.template_file)
    ) {
        ret.delayShow = "A template name and template file is required";
    }
    const matchingTemplate = letterTemplates.find(
        (x) => strip(x.template_name) === strip(letterTemplate.template_name)
    );
    if (matchingTemplate) {
        ret.immediateShow = (
            <p>
                Another letter template exists with name=
                {letterTemplate.template_name}:{" "}
                <b>
                    {matchingTemplate.template_name}{" "}
                    {matchingTemplate.template_file}
                </b>
            </p>
        );
    }
    return ret;
}

function AddLetterTemplateDialog(props: {
    show: boolean;
    onHide: (...args: any[]) => void;
    letterTemplates: LetterTemplate[];
    upsertLetterTemplate: (template: Partial<LetterTemplate>) => any;
    fetchAllLetterTemplates: (...args: any[]) => any;
    availableTemplates: { template_file: string }[];
}) {
    const {
        show,
        onHide = () => {},
        letterTemplates,
        availableTemplates,
        upsertLetterTemplate,
        fetchAllLetterTemplates,
    } = props;
    const [newLetterTemplate, setNewLetterTemplate] = React.useState<
        Partial<LetterTemplate>
    >(BLANK_LETTER_TEMPLATE);

    React.useEffect(() => {
        if (!show) {
            // If the dialog is hidden, reset the state
            setNewLetterTemplate(BLANK_LETTER_TEMPLATE);
        } else {
            // If we've just become visible, fetch all available letter templates
            fetchAllLetterTemplates();
        }
    }, [show, fetchAllLetterTemplates]);

    function createLetterTemplate() {
        upsertLetterTemplate(newLetterTemplate);
        onHide();
    }

    const conflicts = getConflicts(newLetterTemplate, letterTemplates);

    return (
        <Dialog open={show} onClose={onHide} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ m: 0, p: 2 }}>
                Add Letter Template
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
                <LetterTemplateEditor
                    letterTemplate={newLetterTemplate}
                    setLetterTemplate={setNewLetterTemplate}
                    availableTemplates={availableTemplates}
                />
                {conflicts.immediateShow ? (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        {conflicts.immediateShow}
                    </Alert>
                ) : null}
            </DialogContent>
            <DialogActions>
                <Button onClick={onHide} variant="contained" color="secondary">
                    Cancel
                </Button>
                <Button
                    onClick={createLetterTemplate}
                    title={conflicts.delayShow || "Create Letter Template"}
                    disabled={!!conflicts.delayShow || !!conflicts.immediateShow}
                    variant="contained"
                    color="primary"
                >
                    Create Letter Template
                </Button>
            </DialogActions>
        </Dialog>
    );
}
/**
 * AddLetterTemplateDialog that has been connected to the redux store
 */
export function ConnectedAddLetterTemplateDialog(
    props: Pick<
        PropsForElement<typeof AddLetterTemplateDialog>,
        "show" | "onHide"
    >
) {
    const letterTemplates = useSelector(letterTemplatesSelector);
    const availableTemplates = useSelector(allLetterTemplatesSelector);
    const dispatch = useThunkDispatch();
    const _upsertLetterTemplate = React.useCallback(
        (template: Partial<LetterTemplate>) => dispatch(upsertLetterTemplate(template)),
        [dispatch]
    );
    const _fetchAllLetterTemplates = React.useCallback(
        () => dispatch(fetchAllLetterTemplates()),
        [dispatch]
    );
    return (
        <AddLetterTemplateDialog
            letterTemplates={letterTemplates}
            availableTemplates={availableTemplates}
            upsertLetterTemplate={_upsertLetterTemplate}
            fetchAllLetterTemplates={_fetchAllLetterTemplates}
            {...props}
        />
    );
}
