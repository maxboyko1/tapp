import React from "react";
import { useSelector } from "react-redux";
import {
    Alert,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    Switch,
    TextField,
    Typography,
} from "@mui/material";

import {
    allPositionsSelector,
    fetchAllPositions,
    sessionsSelector,
    activeSessionSelector,
    upsertSession,
    deleteSession,
    setActiveSession,
} from "../api/actions";
import { generateDateColumnProps, generateHeaderCellProps } from "./table-utils";
import { AdvancedFilterTable, AdvancedColumnDef } from "./advanced-filter-table";
import { useThunkDispatch } from "../libs/thunk-dispatch";
import { Session } from "../api/defs/types";

/**
 * List the sessions using a ReactTable. `columns` can be passed
 * in to customize columns/cell renderers.
 *
 * @export
 * @param {{columns?: object[], inDeleteMode?: boolean}} props
 * @returns
 */
export function ConnectedSessionsList(props: {
    inDeleteMode?: boolean;
    columns?: AdvancedColumnDef<Session>[];
}) {
    const { inDeleteMode = false } = props;
    const [sessionToDelete, setSessionToDelete] =
        React.useState<Session | null>(null);
    const sessions = useSelector(sessionsSelector);
    const activeSession = useSelector(activeSessionSelector);
    const dispatch = useThunkDispatch();

    React.useEffect(() => {
        dispatch(fetchAllPositions());
    }, [dispatch]);
    const allPositions = useSelector(allPositionsSelector);

    function handleEditRow(original: Session, values: Partial<Session>) {
        dispatch(upsertSession({ ...original, ...values }));
    }

    // Build a hash of sessions that currently have positions assigned 
    const sessionsCurrentlyAssignedHash: Record<number, boolean> = {};
    for (const position of allPositions || []) {
        sessionsCurrentlyAssignedHash[position.session_id] = true;
    }

    const DEFAULT_COLUMNS: AdvancedColumnDef<Session>[] = [
        {
            header: "Name",
            accessorKey: "name",
            meta: { editable: true },
        },
        {
            header: "Start Date",
            accessorKey: "start_date",
            meta: { editable: true },
            ...generateDateColumnProps(),
        },
        {
            header: "End Date",
            accessorKey: "end_date",
            meta: { editable: true },
            ...generateDateColumnProps(),
        },
        {
            header: "Rate (Pre-January)",
            accessorKey: "rate1",
            meta: { editable: true },
            EditCell: ({ value, onChange }) => (
                <TextField
                    type="number"
                    value={value ?? ""}
                    onChange={e => onChange(e.target.value)}
                    size="small"
                    variant="standard"
                    fullWidth
                />
            ),
        },
        {
            header: "Rate (Post-January)",
            accessorKey: "rate2",
            meta: { editable: true },
            EditCell: ({ value, onChange }) => (
                <TextField
                    type="number"
                    value={value ?? ""}
                    onChange={e => onChange(e.target.value)}
                    size="small"
                    variant="standard"
                    fullWidth
                />
            ),
        },
        {
            ...generateHeaderCellProps(
                "Applications Visible",
                "Whether instructors can view applications for their courses"
            ),
            accessorKey: "applications_visible_to_instructors",
            meta: { editable: true },
            EditCell: ({ value, onChange }) => (
                <FormControlLabel
                    control={
                        <Switch
                            checked={!!value}
                            onChange={e => onChange(e.target.checked)}
                            color="secondary"
                        />
                    }
                    label={value ? "True" : "False"}
                />
            ),
            Cell: ({ cell }) => (cell.getValue() ? "True" : "False"),
        },
    ];

    const { columns = DEFAULT_COLUMNS } = props;
    return (
        <React.Fragment>
            <AdvancedFilterTable
                columns={columns}
                filterable={true}
                data={sessions}
                editable={true}
                onEditRow={handleEditRow}
                deleteable={inDeleteMode}
                onDelete={setSessionToDelete}
                deleteBlocked={(session) => (
                    sessionsCurrentlyAssignedHash[session.id]
                        ? "Cannot delete a session that has existing positions"
                        : false
                )}
            />
            <Dialog open={!!sessionToDelete} onClose={() => setSessionToDelete(null)}>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogContent>
                    <Typography variant="body2">
                        Are you sure you want to delete the position{" "}
                        <Typography
                            component="span"
                            color="primary"
                            fontWeight="bold"
                            display="inline"
                        >
                            {sessionToDelete?.name}
                        </Typography>
                        ?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSessionToDelete(null)}>Cancel</Button>
                    <Button
                        color="error"
                        onClick={async () => {
                            if (sessionToDelete === activeSession) {
                                await dispatch(setActiveSession(null));
                            }
                            if (sessionToDelete) {
                                await dispatch(deleteSession(sessionToDelete));
                                setSessionToDelete(null);
                            }
                        }}
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </React.Fragment>
    );
}

export function MissingActiveSessionWarning({ extraText = "" }) {
    return (
        <Alert severity="info">
            There is no active session selected. {extraText}
        </Alert>
    );
}
