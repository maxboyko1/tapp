import React from "react";
import { useSelector } from "react-redux";
import {
    Autocomplete,
    Chip,
    CircularProgress,
    IconButton,
    Stack,
    TextField,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";

import { upsertPosition, instructorsSelector } from "../../../api/actions";
import { useThunkDispatch } from "../../../libs/thunk-dispatch";
import { Instructor, Position } from "../../../api/defs/types";

export function EditInstructorsCell({ row }: { row: { original: Position } }) {
    const position = row.original;
    const dispatch = useThunkDispatch();
    const allInstructors = useSelector(instructorsSelector);

    const [editing, setEditing] = React.useState(false);
    const [value, setValue] = React.useState<Instructor[]>(position.instructors);
    const [inProgress, setInProgress] = React.useState(false);

    const handleSave = async () => {
        setInProgress(true);
        await dispatch(
            upsertPosition({
                id: position.id,
                instructors: value,
            })
        );
        setInProgress(false);
        setEditing(false);
    };

    const handleCancel = () => {
        setValue(position.instructors);
        setEditing(false);
    };

    return (
        <div className="show-on-hover-wrapper">
            {editing ? (
                <>
                    <Autocomplete
                        multiple
                        options={allInstructors}
                        getOptionLabel={(option) => `${option.first_name} ${option.last_name}`}
                        value={value}
                        onChange={(_, newValue) => setValue(newValue)}
                        renderInput={(params) => (
                            <TextField {...params} variant="standard" placeholder="Select instructors" />
                        )}
                        size="small"
                        sx={{ minWidth: 250 }}
                    />
                    <IconButton onClick={handleSave} disabled={inProgress} size="small">
                        {inProgress ? (
                            <CircularProgress size={16} />
                        ) : (
                            <CheckIcon />
                        )}
                    </IconButton>
                    <IconButton onClick={handleCancel} size="small">
                        <CloseIcon />
                    </IconButton>
                </>
            ) : (
                <Stack direction="row" spacing={1} flexWrap="wrap">
                    {position.instructors.map((instructor) => (
                        <Chip
                            key={instructor.id}
                            label={`${instructor.first_name} ${instructor.last_name}`}
                            size="small"
                        />
                    ))}
                    <IconButton
                        onClick={() => setEditing(true)}
                        size="small"
                        title="Edit instructors"
                    >
                        <EditIcon fontSize="small" />
                    </IconButton>
                </Stack>
            )}
        </div>
    );
}
