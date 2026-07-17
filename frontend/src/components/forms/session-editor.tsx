import React from "react";
import { Autocomplete, Box, TextField, Typography } from "@mui/material";
import { fieldEditorFactory, DialogRow } from "./common-controls";
import { Session } from "../../api/defs/types";
/**
 * Edit a session
 *
 * @export
 * @param {{session: object, setSession: function}} props
 * @returns
 */
export function SessionEditor(props: {
    session: Session;
    setSession: (session: Session) => any;
    allSessions: Session[];
}) {
    const { session, setSession, allSessions } = props;

    const createFieldEditor = fieldEditorFactory(session, setSession);

    const validReferenceSessions = allSessions.filter((candidate) => {
        // A valid reference cannot itself be referencing another session.
        if (candidate.hours_ref_session != null) {
            return false;
        }
        // If editing an existing session, do not allow self-reference.
        if (session.id != null && candidate.id === session.id) {
            return false;
        }

        return true;
    });

    const selectedReferenceSession = session.hours_ref_session || null;

    return (
        <Box component="form" noValidate autoComplete="off">
            <DialogRow>
                {createFieldEditor("Session Name (e.g. 2019 Fall)", "name")}
            </DialogRow>
            <DialogRow>
                {createFieldEditor("Start Date", "start_date", "date")}
                {createFieldEditor("End Date", "end_date", "date")}
            </DialogRow>
            <DialogRow>
                {createFieldEditor(
                    "Rate 1 (pre-January rate)",
                    "rate1",
                    "number",
                    {
                        step: "0.01",
                        min: 0,
                    }
                )}
                {createFieldEditor(
                    "Rate 2 (post-January rate)",
                    "rate2",
                    "number",
                    {
                        step: "0.01",
                        min: 0,
                    }
                )}
            </DialogRow>
            <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Reference Session for Appointment Guarantees
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    An existing session from which this one will pull data from, specifically the
                    Min Hours Owed values for the appointment guarantees. A reference session can
                    be any existing session that is not itself referencing another one, and
                    similarly if a reference session is set here, no other session will be able to
                    reference this one.
                </Typography>
                <Autocomplete
                    id="hours-ref-session-input"
                    options={validReferenceSessions}
                    getOptionLabel={(option) => option.name}
                    value={selectedReferenceSession}
                    onChange={(_, value) =>
                        setSession({
                            ...session,
                            hours_ref_session: value ?? null,
                        })
                    }
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            placeholder="Select reference session..."
                            size="small"
                        />
                    )}
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
        </Box>
    );
}
