import React from "react";
import classNames from "classnames";
import {
    Box,
    ButtonBase,
    Divider,
    InputBase,
    Paper,
    Stack,
    Typography,
} from "@mui/material";

import { useThunkDispatch } from "../../../libs/thunk-dispatch";
import { round } from "../../../libs/utils";
import { PositionSummary } from "./types";
import { setSelectedMatchingPosition } from "./actions";

/**
 * A searchable list of position codes.
 */
export function PositionList({
    selectedPositionId,
    positionSummaries,
}: {
    selectedPositionId: number | null;
    positionSummaries: PositionSummary[];
}) {
    const [filterString, setFilterString] = React.useState("");
    const filteredList = React.useMemo(() => {
        return positionSummaries
            .filter(
                (summary) =>
                    summary.position.position_code
                        .toLowerCase()
                        .indexOf(filterString.toLowerCase()) !== -1
            )
            .sort((a, b) => {
                return a.position.position_code
                    .toLowerCase()
                    .localeCompare(
                        b.position.position_code.toLowerCase(),
                        "en",
                        { numeric: true }
                    );
            });
    }, [filterString, positionSummaries]);

    return (
        <Paper className="position-sidebar page-actions" elevation={2}>
            <Box className="search-container position-search">
                <InputBase
                    className="form-control search-bar"
                    placeholder="Filter by position code..."
                    value={filterString}
                    onChange={(e) => setFilterString(e.target.value)}
                    size="small"
                    sx={{
                        fontSize: 14,
                        px: 1,
                        py: 0.5,
                        background: "#f5f5f5",
                        borderRadius: 1,
                        width: "100%",
                        height: 32,
                    }}
                    inputProps={{ "aria-label": "filter by position code" }}
                />
            </Box>
            <Divider sx={{ mb: 1 }} />
            <Box className="position-list" sx={{ flex: 1, overflowY: "auto" }}>
                <Stack className="position-list-inner" spacing={0.5}>
                    {filteredList.map((summary) => (
                        <PositionRow
                            positionSummary={summary}
                            focused={
                                summary?.position.id === selectedPositionId
                            }
                            key={summary.position.id}
                        />
                    ))}
                </Stack>
            </Box>
        </Paper>
    );
}

/**
 * A single row in a list of positions displaying information about
 * how many hours have been assigned and how close it is to being complete.
 */
function PositionRow({
    positionSummary,
    focused,
}: {
    positionSummary: PositionSummary;
    focused: boolean;
}) {
    const dispatch = useThunkDispatch();
    const targetHours = round(
        positionSummary.position.hours_per_assignment *
            (positionSummary.position.desired_num_assignments || 0),
        2
    );

    const progress = React.useMemo(() => {
        if (["matched", "n/a", "over"].includes(positionSummary.filledStatus)) {
            return 100;
        } else if (positionSummary.filledStatus === "under") {
            return round(
                (positionSummary.hoursAssigned / targetHours) * 100,
                0
            );
        }
        return 0;
    }, [positionSummary, targetHours]);

    return (
        <ButtonBase
            className={classNames(
                "position-row",
                positionSummary.filledStatus,
                { selected: focused }
            )}
            onClick={() =>
                dispatch(
                    setSelectedMatchingPosition(positionSummary.position.id)
                )
            }
            sx={{
                width: "100%",
                textAlign: "left",
                borderRadius: 1,
                px: 1,
                py: 0.5,
                bgcolor: focused ? "action.selected" : "background.paper",
                boxShadow: focused ? 2 : 0,
                transition: "background 0.2s",
                display: "flex",
                flexDirection: "column",
                alignItems: "stretch",
                minHeight: 32,
            }}
        >
            <Box
                className={classNames("progress", positionSummary.filledStatus)}
                sx={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${progress}%`,
                    zIndex: 0,
                    pointerEvents: "none",
                }}
            />
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="subtitle2" sx={{ flex: 1, fontSize: 14 }}>
                    {positionSummary.position.position_code}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13 }}>
                    {positionSummary.hoursAssigned} / {targetHours} h
                </Typography>
            </Box>
            {focused && (
                <Typography
                    variant="caption"
                    color="primary"
                    sx={{
                        mt: 0.5,
                        fontSize: 12,
                        position: "relative",
                        zIndex: 1,
                        alignSelf: "flex-start",
                    }}
                >
                    {positionSummary.applicantSummaries.length} applicant
                    {positionSummary.applicantSummaries.length === 1 ? "" : "s"}
                </Typography>
            )}
        </ButtonBase>
    );
}