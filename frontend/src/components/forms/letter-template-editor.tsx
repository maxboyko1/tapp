import React from "react";
import PropTypes from "prop-types";
import {
    Autocomplete,
    Box,
    TextField,
    Typography,
} from "@mui/material";

import { docApiPropTypes } from "../../api/defs/doc-generation";
import { fieldEditorFactory, DialogRow } from "./common-controls";
import { LetterTemplate } from "../../api/defs/types";

const DEFAULT_LETTER_TEMPLATE = {
    template_name: "",
    template_file: "",
};

/**
 * Edit information about a letter_template
 *
 * @export
 * @param {{letterTemplate: object, availableTemplates: object[], setLetterTemplate: function}} props
 * @returns
 */
export function LetterTemplateEditor(props: {
    letterTemplate: Partial<LetterTemplate>;
    setLetterTemplate: (letterTemplate: Partial<LetterTemplate>) => any;
    availableTemplates: { template_file: string }[];
}) {
    const {
        letterTemplate: letterTemplateProp,
        setLetterTemplate,
        availableTemplates = [],
    } = props;
    const letterTemplate = {
        ...DEFAULT_LETTER_TEMPLATE,
        ...letterTemplateProp,
    };

    // update the selected template_file; this comes with side effects
    function setTemplateFile(templates: string[]) {
        const templateFile = templates[templates.length - 1] || "";
        setLetterTemplate({
            ...letterTemplate,
            template_file: templateFile,
        });
    }

    const createFieldEditor = fieldEditorFactory(
        letterTemplate,
        setLetterTemplate
    );

    return (
        <Box component="form" noValidate autoComplete="off">
            <Typography
                variant="body2"
                sx={{ mb: 0 }}
                title="This file is stored on the server; you can edit it there."
            >
                Template Name (e.g. "Regular")
            </Typography>
            <DialogRow>
                {createFieldEditor(
                    '',
                    "template_name"
                )}
            </DialogRow>
            <DialogRow>
                <React.Fragment>
                    <Typography
                        variant="body2"
                        sx={{ mb: 1 }}
                        title="This file is stored on the server; you can edit it there."
                    >
                        Template File
                    </Typography>
                    <Autocomplete
                        id="file-name-input"
                        options={availableTemplates.map((x) => x.template_file)}
                        value={letterTemplate.template_file || ""}
                        onChange={(_, value) => setTemplateFile(value ? [value] : [])}
                        renderInput={(params) => (
                            <TextField {...params} placeholder="File name..." />
                        )}
                        isOptionEqualToValue={(option, value) => option === value}
                        freeSolo={false}
                        disableClearable
                    />
                </React.Fragment>
            </DialogRow>
        </Box>
    );
}
LetterTemplateEditor.propTypes = {
    letterTemplate: docApiPropTypes.letterTemplate.isRequired,
    setLetterTemplate: PropTypes.func.isRequired,
    availableTemplates: PropTypes.arrayOf(
        docApiPropTypes.letterTemplateMinimal
    ),
};
