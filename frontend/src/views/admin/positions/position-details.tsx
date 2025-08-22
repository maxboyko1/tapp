import React from "react";
import {
    Box,
    Chip,
    IconButton,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableRow,
    TextField,
    Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";

import { upsertPosition } from "../../../api/actions";
import { Position } from "../../../api/defs/types";
import { useThunkDispatch } from "../../../libs/thunk-dispatch";
import { EditCustomQuestionsCell } from "./custom-questions-cell";
import { formatDate } from "../../../libs/utils";

/**
 * Show the details of a position.
 */
export function PositionsDetails({ position }: { position: Position }) {
    const dispatch = useThunkDispatch();

    // State for editing duties and qualifications
    const [editingField, setEditingField] = React.useState<null | "duties" | "qualifications">(null);
    const [dutiesValue, setDutiesValue] = React.useState(position.duties ?? "");
    const [qualificationsValue, setQualificationsValue] = React.useState(position.qualifications ?? "");

    // Keep local state in sync if position changes
    React.useEffect(() => {
        setDutiesValue(position.duties ?? "");
        setQualificationsValue(position.qualifications ?? "");
    }, [position.duties, position.qualifications]);

    const handleSave = async (field: "duties" | "qualifications") => {
        if (field === "duties") {
            await dispatch(upsertPosition({ id: position.id, duties: dutiesValue }));
        } else if (field === "qualifications") {
            await dispatch(upsertPosition({ id: position.id, qualifications: qualificationsValue }));
        }
        setEditingField(null);
    };

    return (
        <TableContainer component={Paper}>
            <Table size="small">
                <TableBody>
                    <TableRow>
                        <TableCell sx={{ fontWeight: "bold", width: 180 }}>Position Code</TableCell>
                        <TableCell>{position.position_code}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell sx={{ fontWeight: "bold" }}>Position Title</TableCell>
                        <TableCell>{position.position_title}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell sx={{ fontWeight: "bold" }}>Start Date</TableCell>
                        <TableCell>{formatDate(position.start_date)}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell sx={{ fontWeight: "bold" }}>End Date</TableCell>
                        <TableCell>{formatDate(position.end_date)}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell sx={{ fontWeight: "bold" }}>Contract Template</TableCell>
                        <TableCell colSpan={3}>
                            {position.contract_template?.template_name ? (
                                <Chip
                                    label={position.contract_template.template_name}
                                    color="primary"
                                    variant="outlined"
                                    size="small"
                                    sx={{ mr: 0.5 }}
                                />
                            ) : (
                                <Typography variant="body2" color="text.secondary">
                                    None
                                </Typography>
                            )}
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell sx={{ fontWeight: "bold" }}>Instructors</TableCell>
                        <TableCell colSpan={3}>
                            {(position.instructors && position.instructors.length > 0) ? (
                                <Stack direction="row" spacing={1} flexWrap="wrap">
                                    {position.instructors
                                        .filter(Boolean)
                                        .map((inst, idx) =>
                                            inst ? (
                                                <Chip
                                                    key={inst.id || idx}
                                                    label={`${inst.first_name} ${inst.last_name}`}
                                                    color="primary"
                                                    size="small"
                                                    variant="outlined"
                                                />
                                            ) : null
                                        )}
                                </Stack>
                            ) : (
                                <Typography variant="body2" color="text.secondary">
                                    None
                                </Typography>
                            )}
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell sx={{ fontWeight: "bold" }}>Hours per Assignment</TableCell>
                        <TableCell colSpan={3}>{position.hours_per_assignment}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell sx={{ fontWeight: "bold" }}>Waitlisted</TableCell>
                        <TableCell colSpan={3}>{position.current_waitlisted}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell sx={{ fontWeight: "bold" }}>Desired Number of Assignments</TableCell>
                        <TableCell colSpan={3}>{position.desired_num_assignments}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell sx={{ fontWeight: "bold" }}>Duties</TableCell>
                        <TableCell colSpan={3}>
                            {editingField === "duties" ? (
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <TextField
                                        value={dutiesValue}
                                        onChange={(e) => setDutiesValue(e.target.value)}
                                        multiline
                                        minRows={2}
                                        fullWidth
                                        size="small"
                                        autoFocus
                                    />
                                    <IconButton
                                        size="small"
                                        color="primary"
                                        onClick={() => handleSave("duties")}
                                        title="Save"
                                    >
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        color="inherit"
                                        onClick={() => {
                                            setDutiesValue(position.duties ?? "");
                                            setEditingField(null);
                                        }}
                                        title="Cancel"
                                    >
                                        <CloseIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            ) : (
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <Typography variant="body2" sx={{ whiteSpace: "pre-line", flex: 1 }}>
                                        {position.duties || <span style={{ color: "#888" }}>No duties specified</span>}
                                    </Typography>
                                    <IconButton
                                        size="small"
                                        color="primary"
                                        onClick={() => setEditingField("duties")}
                                        title="Edit duties"
                                    >
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            )}
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell sx={{ fontWeight: "bold" }}>Qualifications</TableCell>
                        <TableCell colSpan={3}>
                            {editingField === "qualifications" ? (
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <TextField
                                        value={qualificationsValue}
                                        onChange={(e) => setQualificationsValue(e.target.value)}
                                        multiline
                                        minRows={2}
                                        fullWidth
                                        size="small"
                                        autoFocus
                                    />
                                    <IconButton
                                        size="small"
                                        color="primary"
                                        onClick={() => handleSave("qualifications")}
                                        title="Save"
                                    >
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        color="inherit"
                                        onClick={() => {
                                            setQualificationsValue(position.qualifications ?? "");
                                            setEditingField(null);
                                        }}
                                        title="Cancel"
                                    >
                                        <CloseIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            ) : (
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <Typography variant="body2" sx={{ whiteSpace: "pre-line", flex: 1 }}>
                                        {position.qualifications || <span style={{ color: "#888" }}>No qualifications specified</span>}
                                    </Typography>
                                    <IconButton
                                        size="small"
                                        color="primary"
                                        onClick={() => setEditingField("qualifications")}
                                        title="Edit qualifications"
                                    >
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            )}
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