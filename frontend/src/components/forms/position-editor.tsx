import PropTypes from "prop-types";
import {
    Autocomplete,
    Box,
    Button,
    Chip,
    Grid,
    IconButton,
    TextField,
    Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

import { docApiPropTypes } from "../../api/defs/doc-generation";
import { fieldEditorFactory, DialogRow } from "./common-controls";
import {
    ContractTemplate,
    Instructor,
    Position,
    RequireSome,
} from "../../api/defs/types";

const DEFAULT_POSITION = {
    position_code: "",
    position_title: "",
    hours_per_assignment: 0,
    contract_template: {},
    duties: "Some combination of marking, invigilating, tutorials, office hours, and the help centre.",
    instructors: [],
    custom_questions: null,
};

/**
 * Edit information about a position
 *
 * @export
 * @param {{position: object, instructors: object[]}} props
 * @returns
 */
export function PositionEditor(props: {
    position: Partial<Position>;
    setPosition: (position: Partial<Position>) => any;
    instructors: Instructor[];
    contractTemplates: ContractTemplate[];
    defaultContractTemplate?: ContractTemplate;
}) {
    const {
        position: positionProp,
        setPosition,
        instructors = [],
        contractTemplates = [],
        defaultContractTemplate = {},
    } = props;
    const position = { ...DEFAULT_POSITION, ...positionProp } as RequireSome<
        Position,
        keyof typeof DEFAULT_POSITION
    >;

    const instructorsWithFullName: Instructor[] = instructors.map((instructor) => ({
        ...instructor,
        full_name: `${instructor.first_name} ${instructor.last_name}`,
    }))

    /**
     * Set `position.instructors` to the specified list.
     *
     * @param {*} instructors
     */
    function setInstructors(instructors: Instructor[]) {
        setPosition({ ...position, instructors });
    }

    /**
     * Set `position.contract_template` to the most recently selected item
     */
    function setContractTemplate(
        selectedContractTemplates: ContractTemplate[]
    ) {
        const contract_template =
            selectedContractTemplates[selectedContractTemplates.length - 1] ||
            defaultContractTemplate;
        setPosition({ ...position, contract_template });
    }

    const createFieldEditor = fieldEditorFactory<Position>(
        position as Position,
        setPosition
    );

    const selectedContractTemplate = position.contract_template
        ? [position.contract_template]
        : [];

    function addCustomQuestion() {
        const newQuestions = position.custom_questions ?
            { ...position.custom_questions } : { elements: [] };
        newQuestions.elements.push({
            type: "comment",
            name: "",
        });
        setPosition({ ...position, custom_questions: newQuestions });
    }

    function deleteCustomQuestion(index: number) {
        if (position.custom_questions) {
            const newQuestions = { ...position.custom_questions };
            newQuestions.elements.splice(index, 1);
            setPosition({ ...position, custom_questions: newQuestions });
        }
    }

    function updateCustomQuestion(index: number, value: string) {
        if (position.custom_questions) {
            const newQuestions = { ...position.custom_questions };
            newQuestions.elements[index].name = value;
            setPosition({ ...position, custom_questions: newQuestions });
        }
    }

    return (
        <Box component="form" noValidate autoComplete="off">
            <DialogRow>
                {createFieldEditor(
                    "Position Code (e.g. MAT135H1F)",
                    "position_code"
                )}
                {createFieldEditor("Course Title", "position_title")}
            </DialogRow>
            <Typography variant="body2" sx={{ ml: 2, alignSelf: "center" }}>
                (If start/end dates are left blank, the session start/end dates will be used.)
            </Typography>
            <DialogRow>
                {createFieldEditor("Start Date*", "start_date", "date")}
                {createFieldEditor("End Date*", "end_date", "date")}
            </DialogRow>
            <DialogRow>
                {createFieldEditor(
                    "Hours per Assignment",
                    "hours_per_assignment",
                    "number"
                )}
            </DialogRow>
            <Box sx={{ my: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                    Instructors
                </Typography>
                <Autocomplete
                    multiple
                    options={instructorsWithFullName}
                    getOptionLabel={(option) =>
                        `${option.first_name} ${option.last_name}`
                    }
                    value={position.instructors}
                    onChange={(_, value) => setInstructors(value as Instructor[])}
                    renderInput={(params) => (
                        <TextField {...params} placeholder="Instructors..." />
                    )}
                    isOptionEqualToValue={(option, value) =>
                        option.utorid === value.utorid
                    }
                    renderValue={(selected) =>
                        selected.map((option: Instructor) => (
                            <Chip
                                key={option.utorid}
                                label={`${option.first_name} ${option.last_name}`}
                                color="primary"
                                variant="outlined"
                            />
                        ))
                    }
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
            <Box sx={{ my: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                    Contract Template (which offer template will be used)
                </Typography>
                <Autocomplete
                    multiple={false}
                    id="contract-template-input"
                    options={contractTemplates}
                    getOptionLabel={(option) => option.template_name || ""}
                    value={selectedContractTemplate[0] || null}
                    onChange={(_, value) =>
                        setContractTemplate([value as ContractTemplate])
                    }
                    renderInput={(params) => (
                        <TextField {...params} placeholder="Contract template..." />
                    )}
                    isOptionEqualToValue={(option, value) =>
                        option.id === value.id
                    }
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
            <Typography variant="h6" sx={{ mt: 3 }}>
                Ad-related Info
            </Typography>
            <DialogRow>{createFieldEditor("Duties", "duties")}</DialogRow>
            <DialogRow>
                {createFieldEditor("Qualifications", "qualifications")}
            </DialogRow>
            <Typography variant="h6" sx={{ mt: 3 }}>
                Admin Info
            </Typography>
            <DialogRow>
                {createFieldEditor(
                    "Current Enrollment",
                    "current_enrollment",
                    "number"
                )}
                {createFieldEditor("Waitlist", "current_waitlisted", "number")}
                {createFieldEditor(
                    "Desired Number of Assignments",
                    "desired_num_assignments",
                    "number"
                )}
            </DialogRow>
            <Typography variant="h6" sx={{ mt: 3 }}>
                Position-Specific Custom Questions
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
                Define your custom questions for this position in textboxes you can add below. All must be non-empty.
            </Typography>
            <Grid container spacing={2} direction="column">
                {position.custom_questions?.elements.map((question: { name: string }, index: number) => (
                    <Grid key={index}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <TextField
                                type="text"
                                value={question.name}
                                placeholder="Write your question here..."
                                onChange={(e) => updateCustomQuestion(index, e.target.value)}
                                size="small"
                                fullWidth
                            />
                            <IconButton
                                color="info"
                                onClick={() => deleteCustomQuestion(index)}
                                aria-label="Delete question"
                            >
                                <DeleteIcon />
                            </IconButton>
                        </Box>
                    </Grid>
                ))}
                <Grid>
                    <Button
                        variant="outlined"
                        color="info"
                        onClick={addCustomQuestion}
                    >
                        Add Custom Question
                    </Button>
                </Grid>
            </Grid>
        </Box>
    );
}
PositionEditor.propTypes = {
    position: docApiPropTypes.position.isRequired,
    setPosition: PropTypes.func.isRequired,
    instructors: PropTypes.arrayOf(docApiPropTypes.instructor),
    defaultContractTemplate: docApiPropTypes.contractTemplate,
    contractTemplates: PropTypes.arrayOf(docApiPropTypes.contractTemplate),
};
