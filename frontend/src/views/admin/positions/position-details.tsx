
import React from "react"
import { useSelector } from "react-redux";
import {
    Autocomplete,
    Box,
    Chip,
    Stack,
    IconButton,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableRow,
    TextField,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";

import { contractTemplatesSelector, instructorsSelector, upsertPosition } from "../../../api/actions";
import { Position } from "../../../api/defs/types";
import { useThunkDispatch } from "../../../libs/thunk-dispatch";
import { EditCustomQuestionsCell } from "./custom-questions-cell";
import { formatDate } from "../../../libs/utils";

type EditableCellProps = {
    value: any;
    type?: "text" | "number" | "date" | "paragraph";
    options?: any[];
    multiple?: boolean;
    onChange: (value: any) => void;
    label?: string;
    getOptionLabel?: (option: any) => string;
};

function EditableCell({
    value,
    type = "text",
    options,
    multiple,
    onChange,
    label,
    getOptionLabel,
}: EditableCellProps) {
    const [editMode, setEditMode] = React.useState(false);
    const [internalValue, setInternalValue] = React.useState(value);

    React.useEffect(() => {
        setInternalValue(value);
    }, [value]);

    const handleSave = () => {
        setEditMode(false);
        onChange(internalValue);
    };

    const handleCancel = () => {
        setEditMode(false);
        setInternalValue(value);
    };

    // Helper for label rendering in display mode
    const renderDisplayValue = () => {
        if (type === "date") {
            if (!value) return "";
            return formatDate(value);
        }
        if (options && getOptionLabel) {
            if (multiple) {
                if (!Array.isArray(value) || value.length === 0) return "";
                return (
                    <Stack direction="row" gap={0.25} flexWrap="wrap">
                        {value.map((opt: any, idx: number) => (
                            <Chip
                                key={opt?.id ?? idx}
                                color="primary"
                                label={getOptionLabel(opt)}
                                size="small"
                            />
                        ))}
                    </Stack>
                );
            } else {
                if (!value) return "";
                return (
                    <Chip
                        color="primary"
                        label={getOptionLabel(value)}
                        size="small"
                    />
                );
            }
        }
        // Default: just show as string
        return <span>{String(value ?? "")}</span>;
    };

    let input: React.ReactNode = null;
    if (type === "date") {
        // Default to today if value is empty or invalid
        let dateValue = internalValue;
        if (!dateValue || isNaN(new Date(dateValue).getTime())) {
            dateValue = new Date();
        }
        input = (
            <DatePicker
                value={dateValue}
                onChange={(newValue) => setInternalValue(newValue)}
                slotProps={{
                    textField: {
                        size: "small",
                        placeholder: formatDate(dateValue),
                    }
                }}
                label={formatDate(dateValue)}
            />
        );
    } else if (options) {
        if (multiple) {
            input = (
                <Autocomplete
                    multiple
                    options={options}
                    getOptionLabel={getOptionLabel ??
                        (option => (typeof option === "string"
                            ? option
                            : option.label || option.name || String(option.id)))}
                    value={internalValue || []}
                    onChange={(_, newValue) => setInternalValue(newValue)}
                    size="small"
                    sx={{ minWidth: 250 }}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            variant="standard"
                            placeholder="Select..."
                            label={label}
                        />
                    )}
                    renderValue={(selected: any[] = [], getTagProps) => (
                        <Stack direction="row" gap={0.25} flexWrap="wrap">
                            {selected.map((opt: any, idx: number) => (
                                <Chip
                                    color="primary"
                                    label={
                                        getOptionLabel
                                            ? getOptionLabel(opt)
                                            : typeof opt === "string"
                                            ? opt
                                            : opt.label || opt.name || String(opt.id)
                                    }
                                    size="small"
                                    {...getTagProps({ index: idx })}
                                />
                            ))}
                        </Stack>
                    )}
                    slotProps={{
                        paper: {
                            sx: (theme) => ({
                                backgroundColor: theme.palette.primary.main,
                                color: theme.palette.primary.contrastText,
                            })
                        }
                    }}
                />
            );
        } else {
            input = (
                <Autocomplete
                    options={options}
                    getOptionLabel={getOptionLabel ??
                        (option => (typeof option === "string"
                            ? option
                            : option.label || option.name || String(option.id)))}
                    value={internalValue ?? null}
                    onChange={(_, newValue) => setInternalValue(newValue)}
                    size="small"
                    sx={{ minWidth: 250 }}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            variant="standard"
                            placeholder="Select..."
                            label={label}
                        />
                    )}
                    renderOption={(props, option) => (
                        <li {...props} key={option.id}>
                            {getOptionLabel
                                ? getOptionLabel(option)
                                : typeof option === "string"
                                ? option
                                : option.label || option.name || String(option.id)}
                        </li>
                    )}
                    slotProps={{
                        paper: {
                            sx: (theme) => ({
                                backgroundColor: theme.palette.primary.main,
                                color: theme.palette.primary.contrastText,
                            })
                        }
                    }}
                />
            );
        }
    } else if (type === "paragraph") {
        input = (
            <TextField
                value={internalValue || ""}
                onChange={(e) => setInternalValue(e.target.value)}
                multiline
                minRows={2}
                fullWidth
                size="small"
            />
        );
    } else {
        input = (
            <TextField
                value={internalValue ?? ""}
                onChange={(e) =>
                    setInternalValue(
                        type === "number" ? Number(e.target.value) : e.target.value
                    )
                }
                type={type}
                size="small"
                fullWidth
            />
        );
    }

    return (
        <Box
            sx={{
                position: "relative",
                "&:hover .edit-btn": { opacity: editMode ? 0 : 1 },
                cursor: editMode ? "default" : "pointer",
            }}
            onClick={() => !editMode && setEditMode(true)}
        >
            {editMode ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {input}
                    <IconButton size="small" color="primary" onClick={handleSave}>
                        <CheckIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="inherit" onClick={handleCancel}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Box>
            ) : (
                <Box sx={{ minHeight: 32, display: "flex", alignItems: "center" }}>
                    {renderDisplayValue()}
                    <IconButton
                        className="edit-btn"
                        size="small"
                        sx={{
                            ml: 1,
                            opacity: 0,
                            transition: "opacity 0.2s",
                            pointerEvents: "none",
                        }}
                        tabIndex={-1}
                        disableRipple
                    >
                        <EditIcon fontSize="small" />
                    </IconButton>
                </Box>
            )}
        </Box>
    );
}

/**
 * Show the details of a position.
 */
export function PositionsDetails({ position }: { position: Position }) {
    const instructors = useSelector(instructorsSelector)
    const contractTemplates = useSelector(contractTemplatesSelector)

    const dispatch = useThunkDispatch();
    function handleFieldChange(field: keyof Position, value: any) {
        return dispatch(upsertPosition({id: position.id, [field]: value}));
    }
    return (
        <TableContainer component={Paper}>
            <Table size="small">
                <TableBody>
                    <TableRow>
                        <TableCell sx={{ fontWeight: "bold", width: 180 }}>Position Code</TableCell>
                        <TableCell>
                            <EditableCell
                                value={position.position_code}
                                onChange={(v) => handleFieldChange("position_code", v)}
                            />
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell sx={{ fontWeight: "bold" }}>Position Title</TableCell>
                        <TableCell>
                            <EditableCell
                                value={position.position_title}
                                onChange={(v) => handleFieldChange("position_title", v)}
                            />
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell sx={{ fontWeight: "bold" }}>Start Date</TableCell>
                        <TableCell>
                            <EditableCell
                                value={position.start_date}
                                type="date"
                                onChange={(v) => handleFieldChange("start_date", v)}
                            />
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell sx={{ fontWeight: "bold" }}>End Date</TableCell>
                        <TableCell>
                            <EditableCell
                                value={position.end_date}
                                type="date"
                                onChange={(v) => handleFieldChange("end_date", v)}
                            />
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell sx={{ fontWeight: "bold" }}>Contract Template</TableCell>
                        <TableCell colSpan={3}>
                            <EditableCell
                                value={position.contract_template}
                                options={contractTemplates}
                                label="Contract Template"
                                getOptionLabel={(option) => option?.template_name ?? ""}
                                onChange={(v) => handleFieldChange("contract_template", v)}
                            />
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell sx={{ fontWeight: "bold" }}>Instructors</TableCell>
                        <TableCell colSpan={3}>
                            <EditableCell
                                value={position.instructors}
                                options={instructors}
                                multiple
                                label="Instructors"
                                onChange={(v) => handleFieldChange("instructors", v)}
                                getOptionLabel={(option) =>
                                    option ? `${option.first_name} ${option.last_name}` : ""
                                }
                            />
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell sx={{ fontWeight: "bold" }}>Hours per Assignment</TableCell>
                        <TableCell colSpan={3}>
                            <EditableCell
                                value={position.hours_per_assignment}
                                type="number"
                                onChange={(v) => handleFieldChange("hours_per_assignment", v)}
                            />
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell sx={{ fontWeight: "bold" }}>Waitlisted</TableCell>
                        <TableCell colSpan={3}>
                            <EditableCell
                                value={position.current_waitlisted}
                                type="number"
                                onChange={(v) => handleFieldChange("current_waitlisted", v)}
                            />
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell sx={{ fontWeight: "bold" }}>Desired Number of Assignments</TableCell>
                        <TableCell colSpan={3}>
                            <EditableCell
                                value={position.desired_num_assignments}
                                type="number"
                                onChange={(v) => handleFieldChange("desired_num_assignments", v)}
                            />
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell sx={{ fontWeight: "bold" }}>Duties</TableCell>
                        <TableCell colSpan={3}>
                            <EditableCell
                                value={position.duties}
                                type="paragraph"
                                onChange={(v) => handleFieldChange("duties", v)}
                            />
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell sx={{ fontWeight: "bold" }}>Qualifications</TableCell>
                        <TableCell colSpan={3}>
                            <EditableCell
                                value={position.qualifications}
                                type="paragraph"
                                onChange={(v) => handleFieldChange("qualifications", v)}
                            />
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell sx={{ fontWeight: "bold" }}>Custom Questions</TableCell>
                        <TableCell colSpan={3}>
                            <EditCustomQuestionsCell row={{ original: position }} showVertically={true} />
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </TableContainer>
    );
}
