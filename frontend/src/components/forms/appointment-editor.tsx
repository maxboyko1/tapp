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

    const applicantsWithFullName: (Applicant & { full_name: string })[] = applicants.map((applicant) => ({
        ...applicant,
        full_name: `${applicant.first_name} ${applicant.last_name}`,
    }));

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
        <Box component="form" noValidate autoComplete="off">
            <Box sx={{ mb: 2 }}>
                <Autocomplete
                    id="applicant-input"
                    options={applicantsWithFullName}
                    getOptionLabel={(option) => option.full_name}
                    value={
                        !applicantMatchingDatum.applicant ||
                        applicantMatchingDatum.applicant.id === null
                            ? null
                            : applicantsWithFullName.find(
                                (a) => a.id === applicantMatchingDatum.applicant.id
                            ) || null
                    }
                    onChange={(_, value) =>
                        setApplicant(value ? [value] : [])
                    }
                    renderInput={(params) => (
                        <TextField {...params} placeholder="Applicant..." size="small" />
                    )}
                    disabled={lockApplicant}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    slotProps={{
                        paper: {
                            sx: (theme) => ({
                                bgcolor: theme.palette.primary.main,
                                color: theme.palette.primary.contrastText,
                            }),
                        },
                    }}
                />
            </Box>
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
            <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Letter Template
                </Typography>
                <Autocomplete
                    id="letter-template-input"
                    options={letterTemplates}
                    getOptionLabel={(option) => option.template_name}
                    value={selectedLetterTemplate[0] || null}
                    onChange={(_, value) =>
                        setLetterTemplate([
                            (value as LetterTemplate) || defaultLetterTemplate,
                        ])
                    }
                    renderInput={(params) => (
                        <TextField {...params} placeholder="Letter template..." size="small" />
                    )}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    disableClearable
                    slotProps={{
                        paper: {
                            sx: (theme) => ({
                                bgcolor: theme.palette.primary.main,
                                color: theme.palette.primary.contrastText,
                            }),
                        },
                    }}
                />
            </Box>
        </Box>
    );
}
AppointmentEditor.propTypes = {
    applicantMatchingDatum: docApiPropTypes.applicant_matching_datum.isRequired,
    setApplicantMatchingDatum: PropTypes.func.isRequired,
    applicants: PropTypes.arrayOf(docApiPropTypes.applicant),
    defaultLetterTemplate: docApiPropTypes.letterTemplate,
    letterTemplates: PropTypes.arrayOf(docApiPropTypes.letterTemplate),
};
