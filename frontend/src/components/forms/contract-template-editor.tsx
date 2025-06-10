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
import { ContractTemplate } from "../../api/defs/types";

const DEFAULT_CONTRACT_TEMPLATE = {
    template_name: "",
    template_file: "",
};

/**
 * Edit information about a contract_template
 *
 * @export
 * @param {{contractTemplate: object, availableTemplates: object[], setContractTemplate: function}} props
 * @returns
 */
export function ContractTemplateEditor(props: {
    contractTemplate: Partial<ContractTemplate>;
    setContractTemplate: (contractTemplate: Partial<ContractTemplate>) => any;
    availableTemplates: { template_file: string }[];
}) {
    const {
        contractTemplate: contractTemplateProp,
        setContractTemplate,
        availableTemplates = [],
    } = props;
    const contractTemplate = {
        ...DEFAULT_CONTRACT_TEMPLATE,
        ...contractTemplateProp,
    };

    // update the selected template_file; this comes with side effects
    function setTemplateFile(templates: string[]) {
        const templateFile = templates[templates.length - 1] || "";
        setContractTemplate({
            ...contractTemplate,
            template_file: templateFile,
        });
    }

    const createFieldEditor = fieldEditorFactory(
        contractTemplate,
        setContractTemplate
    );

    return (
        <Box component="form" noValidate autoComplete="off">
            <Typography
                variant="body2"
                sx={{ mb: 0 }}
                title="This file is stored on the server; you can edit it there."
            >
                Template Name (e.g. &quot;OTO&quot; &quot;Invigilate&quot;)
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
                        value={contractTemplate.template_file || ""}
                        onChange={(_, value) =>
                            setTemplateFile(value ? [value] : [])
                        }
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
ContractTemplateEditor.propTypes = {
    contractTemplate: docApiPropTypes.contractTemplate.isRequired,
    setContractTemplate: PropTypes.func.isRequired,
    availableTemplates: PropTypes.arrayOf(
        docApiPropTypes.contractTemplateMinimal
    ),
};
