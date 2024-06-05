import React from "react";
import PropTypes from "prop-types";
import { Form } from "react-bootstrap";
import { Typeahead } from "react-bootstrap-typeahead";

import "react-bootstrap-typeahead/css/Typeahead.css";
import { docApiPropTypes } from "../../api/defs/doc-generation";
import { fieldEditorFactory, DialogRow } from "./common-controls";
import {
    Applicant,
    ApplicantMatchingDatum,
    LetterTemplate,
    RequireSome
} from "../../api/defs/types";

const DEFAULT_APPOINTMENT = {
    applicant: { id: null },
    session: { id: null },
    min_hours_owed: 0,
    max_hours_owed: null,
    prev_hours_fulfilled: null,
    letter_template: {},
};

/**
 * Edit information about an appointment
 */
export function AppointmentEditor(props: {
    applicantMatchingDatum: Partial<ApplicantMatchingDatum>;
    setApplicantMatchingDatum: (
        applicantMatchingDatum: Partial<ApplicantMatchingDatum>
    ) => any;
    applicants: Applicant[];
    letterTemplates: LetterTemplate[];
    defaultLetterTemplate?: LetterTemplate;
    lockApplicant?: boolean;
}) {
    const {
        applicantMatchingDatum: applicantMatchingDatumProp,
        setApplicantMatchingDatum,
        applicants = [],
        letterTemplates,
        defaultLetterTemplate,
        lockApplicant,
    } = props;
    const applicantMatchingDatum = {
        ...DEFAULT_APPOINTMENT,
        ...applicantMatchingDatumProp,
    } as RequireSome<ApplicantMatchingDatum, keyof typeof DEFAULT_APPOINTMENT>;

    function setApplicant(applicants: Applicant[]) {
        const applicant = applicants[applicants.length - 1] || { id: null };
        setApplicantMatchingDatum({
            ...applicantMatchingDatum,
            applicant,
        });
    }

    const createFieldEditor = fieldEditorFactory<ApplicantMatchingDatum>(
        applicantMatchingDatum as ApplicantMatchingDatum,
        setApplicantMatchingDatum
    );

    /**
     * Set `applicantMatchingDatum.letter_template` to the most recently selected item
     */
    function setLetterTemplate(
        selectedLetterTemplates: LetterTemplate[]
    ) {
        const letter_template =
            selectedLetterTemplates[selectedLetterTemplates.length - 1] ||
            defaultLetterTemplate;
        setApplicantMatchingDatum({ ...applicantMatchingDatum, letter_template });
    }

    const selectedLetterTemplate = applicantMatchingDatum.letter_template
        ? [applicantMatchingDatum.letter_template]
        : [];

    return (
        <Form>
            <Form.Group>
                <Form.Label>Applicant</Form.Label>
                <Typeahead
                    id="applicant-input"
                    ignoreDiacritics={true}
                    placeholder="Applicant..."
                    labelKey={(option: Applicant) =>
                        `${option.first_name} ${option.last_name}`
                    }
                    selected={
                        !applicantMatchingDatum.applicant ||
                        applicantMatchingDatum.applicant.id === null
                            ? []
                            : [applicantMatchingDatum.applicant]
                    }
                    options={applicants}
                    onChange={setApplicant}
                    disabled={lockApplicant}
                />
            </Form.Group>
            <DialogRow>
                {createFieldEditor(
                    "Minimum Hours Owed",
                    "min_hours_owed",
                    "number"
                )}
                {createFieldEditor(
                    "Maximum Hours Owed",
                    "max_hours_owed",
                    "number"
                )}
                {createFieldEditor(
                    "Previous Hours Fulfilled",
                    "prev_hours_fulfilled",
                    "number"
                )}
            </DialogRow>
            <Form.Group>
                <Form.Label>
                    Letter Template (which letter template will be used)
                </Form.Label>
                <Typeahead
                    id="instructors-input"
                    ignoreDiacritics={true}
                    multiple
                    placeholder="Letter template..."
                    labelKey={(option) => `${option.template_name}`}
                    selected={selectedLetterTemplate}
                    options={letterTemplates}
                    onChange={setLetterTemplate}
                />
            </Form.Group>
        </Form>
    );
}
AppointmentEditor.propTypes = {
    applicantMatchingDatum: docApiPropTypes.applicant_matching_datum.isRequired,
    setApplicantMatchingDatum: PropTypes.func.isRequired,
    applicants: PropTypes.arrayOf(docApiPropTypes.applicant),
    defaultLetterTemplate: docApiPropTypes.letterTemplate,
    letterTemplates: PropTypes.arrayOf(docApiPropTypes.letterTemplate),
};
