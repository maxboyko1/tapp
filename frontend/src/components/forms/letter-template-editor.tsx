import React from "react";
import PropTypes from "prop-types";
import { Form } from "react-bootstrap";
import { Typeahead } from "react-bootstrap-typeahead";

import "react-bootstrap-typeahead/css/Typeahead.css";
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
        <Form>
            <DialogRow>
                {createFieldEditor(
                    'Template Name (e,g, "Regular")',
                    "template_name"
                )}
            </DialogRow>
            <DialogRow>
                <React.Fragment>
                    <Form.Label title="This file is stored on the server; you can edit it there.">
                        Template File
                    </Form.Label>
                    <Typeahead
                        id="file-name-input"
                        ignoreDiacritics={true}
                        placeholder="File name..."
                        multiple
                        selected={
                            !letterTemplate.template_file
                                ? []
                                : [letterTemplate.template_file]
                        }
                        options={availableTemplates.map((x) => x.template_file)}
                        onChange={setTemplateFile}
                        {
                            // XXX For some reason the typeahead types seem to be incorrect here;
                            // they disallow the `labelKey` attr, but it works just fine.
                            // So, we trick typescript into allow the attr.
                            ...({
                                labelKey: (option: any) => `${option}`,
                            } as any)
                        }
                    />
                </React.Fragment>
            </DialogRow>
        </Form>
    );
}
LetterTemplateEditor.propTypes = {
    letterTemplate: docApiPropTypes.letterTemplate.isRequired,
    setLetterTemplate: PropTypes.func.isRequired,
    availableTemplates: PropTypes.arrayOf(
        docApiPropTypes.letterTemplateMinimal
    ),
};
