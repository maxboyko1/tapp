import React from "react";
import { useSelector } from "react-redux";
import {
    Box,
    FormControlLabel,
    Paper,
    Switch,
    Typography,
} from "@mui/material";

import {
    deletePostingPosition,
    positionsSelector,
    upsertPostingPosition,
} from "../../../../api/actions";
import { Posting } from "../../../../api/defs/types";
import { AdvancedFilterTable, AdvancedColumnDef } from "../../../../components/advanced-filter-table";
import { formatDate } from "../../../../libs/utils";
import { useThunkDispatch } from "../../../../libs/thunk-dispatch";
import { generateNumberCell } from "../../../../components/table-utils";
import { EditCustomQuestionsCell } from "../custom-questions-cell";
import { isQuestionsFieldInValidFormat } from "../../../../components/custom-question-utils";

interface PostingPositionRow {
    id: number;
    position_id: number;
    posting_id: number;
    position_code: string;
    position_title: string;
    num_positions: number | null;
    hours: number | null;
    true_posting_position: boolean;
}

export function ConnectedPostingDetailsView({ posting }: { posting: Posting }) {
    const dispatch = useThunkDispatch();
    const posting_id = posting.id;
    const positions = useSelector(positionsSelector);

    // Build table data from backend
    const tableData: PostingPositionRow[] = React.useMemo(() => {
        const postingPositions = posting.posting_positions;
        return positions.map((position): PostingPositionRow => {
            const postingPosition = postingPositions.find(
                (pp) => pp.position.id === position.id
            );
            const overrideData: Partial<PostingPositionRow> = {};
            if (postingPosition) {
                overrideData.hours = postingPosition.hours;
                overrideData.num_positions = postingPosition.num_positions;
                overrideData.true_posting_position = true;
            }
            return {
                id: position.id,
                position_id: position.id,
                hours: position.hours_per_assignment,
                num_positions: position.desired_num_assignments,
                posting_id: posting_id || 0,
                position_code: position.position_code,
                position_title: position.position_title || "",
                true_posting_position: false,
                ...overrideData,
            };
        });
    }, [posting_id, posting, positions]);

    // Handler for toggling inclusion
    const handleToggleIncluded = React.useCallback(
        async (row: PostingPositionRow, value: boolean) => {
            const position = positions.find((p) => p.id === row.position_id);
            if (!position) return;

            if (value) {
                // Add to posting
                await dispatch(
                    upsertPostingPosition({
                        position,
                        posting,
                        hours: row.hours,
                        num_positions: row.num_positions,
                    })
                );
            } else {
                // Remove from posting
                const postingPosition = posting.posting_positions.find(
                    (pp) => pp.position.id === row.position_id
                );
                if (postingPosition) {
                    await dispatch(deletePostingPosition(postingPosition));
                }
            }
        },
        [dispatch, posting, positions]
    );

    const columns: AdvancedColumnDef<PostingPositionRow>[] = [
        {
            header: "Included?",
            accessorKey: "true_posting_position",
            Cell: ({ row }) => (
                <FormControlLabel
                    control={
                        <Switch
                            checked={row.original.true_posting_position}
                            onChange={(_, checked) => handleToggleIncluded(row.original, checked)}
                            color="secondary"
                        />
                    }
                    label=""
                />
            ),
            size: 80,
        },
        {
            header: "Position Code",
            accessorKey: "position_code",
        },
        {
            header: "Num Positions",
            accessorKey: "num_positions",
            meta: { editable: true },
            EditCell: generateNumberCell(),
        },
        {
            header: "Hours per Assignment",
            accessorKey: "hours",
            meta: { editable: true },
            EditCell: generateNumberCell(),
        },
    ];

    function handleEditRow(original: PostingPositionRow, values: Partial<PostingPositionRow>) {
        if (!original.true_posting_position) return;
        // Only update fields that are editable (num_positions, hours)
        const update: Partial<PostingPositionRow> = {};
        if ('num_positions' in values) update.num_positions = values.num_positions;
        if ('hours' in values) update.hours = values.hours;

        dispatch(
            upsertPostingPosition({
                position_id: original.position_id,
                posting_id: original.posting_id,
                ...update,
            })
        );
    }

    let numCustomQuestions = 0;
    const elements = posting.custom_questions?.elements;
    if (Array.isArray(elements)) {
        numCustomQuestions = elements.length;
    }

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Posting Name:</strong> {posting.name || <em>Not set</em>}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Open Date:</strong> {formatDate(posting.open_date ?? "")}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Close Date:</strong> {formatDate(posting.close_date ?? "")}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Intro Text:</strong> {posting.intro_text || <em>Not set</em>}
            </Typography>

            <Typography variant="subtitle2" sx={{ mt: 2 }} gutterBottom>
                Posting Positions
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
                The selected positions below will be available when applicants
                apply to this posting (You cannot edit <em>Num Position</em> or{" "}
                <em>Hours per Assignment</em> until it is selected as part of
                this posting.)
            </Typography>
            <Paper
                variant="outlined"
                sx={{
                    mb: 2,
                    p: 1,
                    maxHeight: posting.posting_positions.length ? "46vh" : "41vh",
                    overflow: "auto",
                }}
            >
                <AdvancedFilterTable
                    columns={columns}
                    data={tableData}
                    filterable={true}
                    editable={true}
                    onEditRow={handleEditRow}
                    editBlocked={React.useCallback(
                        (row: PostingPositionRow) =>
                            row.true_posting_position
                                ? false
                                : "You can only edit info associated with included positions",
                        []
                    )}
                />
            </Paper>

            <Typography variant="subtitle2" gutterBottom>
                Custom Questions
            </Typography>
            {isQuestionsFieldInValidFormat(posting.custom_questions) ? (
                <>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                        There are currently {numCustomQuestions} custom questions for this posting.
                    </Typography>
                    <EditCustomQuestionsCell
                        row={{ original: posting }}
                    />
                </>
            ) : (
                <Typography color="error">
                    (Uneditable, questions in deprecated JSON format)
                </Typography>
            )}
        </Box>
    );
}
