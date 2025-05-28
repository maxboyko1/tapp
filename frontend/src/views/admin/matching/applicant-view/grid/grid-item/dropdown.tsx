import React from "react";
import { MenuItem, ListItemText } from "@mui/material";

import { ApplicantSummary } from "../../../types";
import { Application, Position } from "../../../../../../api/defs/types";
import {
    toggleAssigned,
    toggleStarred,
    toggleHidden,
    toggleApplicantHidden,
} from "../../../match-actions/modify-match-status";
import { useThunkDispatch } from "../../../../../../libs/thunk-dispatch";
import { getMatchStatus, prepApplicantMatchForPosition } from "../../../utils";

/**
 * A dropdown list of actions to perform on an applicant/grid item.
 */
export function GridItemDropdown({
    applicantSummary,
    position,
    setShownApplication,
    setShowChangeHours,
    setShowNote,
    onClose,
}: {
    applicantSummary: ApplicantSummary;
    position: Position;
    setShownApplication: (shownApplication: Application | null) => void;
    setShowChangeHours: (show: boolean) => void;
    setShowNote: (show: boolean) => void;
    onClose: () => void;
}) {
    const matchStatus = React.useMemo(() => {
        return getMatchStatus(applicantSummary, position);
    }, [applicantSummary, position]);

    const applicantMatch = React.useMemo(() => {
        return prepApplicantMatchForPosition(applicantSummary, position);
    }, [applicantSummary, position]);

    const canBeAssigned =
        matchStatus === "hidden" ||
        matchStatus === "applied" ||
        matchStatus === "starred";

    const canBeHidden =
        matchStatus !== "assigned" &&
        matchStatus !== "staged-assigned" &&
        matchStatus !== "unassignable";

    const canBeStarred =
        matchStatus !== "assigned" && matchStatus !== "staged-assigned";

    const dispatch = useThunkDispatch();

    async function _toggleStarred() {
        await dispatch(toggleStarred(applicantSummary, position));
    }

    async function _toggleHidden() {
        await dispatch(toggleHidden(applicantSummary, position));
    }

    async function _toggleAssigned() {
        await dispatch(
            toggleAssigned(
                applicantSummary,
                position,
                position.hours_per_assignment || 0
            )
        );
    }

    async function _toggleApplicantHidden() {
        await dispatch(
            toggleApplicantHidden(applicantSummary.applicantMatchingDatum)
        );
    }

    return (
        <>
            <MenuItem
                onClick={() => {
                    setShownApplication(applicantSummary.application);
                    onClose();
                }}
            >
                <ListItemText>View application details</ListItemText>
            </MenuItem>
            <MenuItem
                onClick={() => {
                    setShowNote(true);
                    onClose();
                }}
            >
                <ListItemText>View/edit applicant notes</ListItemText>
            </MenuItem>

            {matchStatus === "staged-assigned" && (
                <MenuItem
                    onClick={() => {
                        setShowChangeHours(true);
                        onClose();
                    }}
                >
                    <ListItemText>Change assigned hours</ListItemText>
                </MenuItem>
            )}
            {(canBeAssigned || matchStatus === "staged-assigned") && (
                <MenuItem
                    onClick={() => {
                        _toggleAssigned();
                        onClose();
                    }}
                >
                    <ListItemText>
                        {canBeAssigned ? "Assign to " : "Unassign from "}
                        <b>{position.position_code}</b>
                        {canBeAssigned
                            ? ` (${position.hours_per_assignment || 0})`
                            : ""}
                    </ListItemText>
                </MenuItem>
            )}
            {canBeStarred && (
                <MenuItem
                    onClick={() => {
                        _toggleStarred();
                        onClose();
                    }}
                >
                    <ListItemText>
                        {applicantMatch.starred ? "Star for " : "Unstar from "}
                        <b>{position.position_code}</b>
                    </ListItemText>
                </MenuItem>
            )}
            {canBeHidden && (
                <>
                    <MenuItem
                        onClick={() => {
                            _toggleHidden();
                            onClose();
                        }}
                    >
                        <ListItemText>
                            {applicantMatch.hidden ? "Unhide " : "Hide "} from{" "}
                            <b>{position.position_code}</b>
                        </ListItemText>
                    </MenuItem>
                    <MenuItem
                        onClick={() => {
                            _toggleApplicantHidden();
                            onClose();
                        }}
                    >
                        <ListItemText>
                            {applicantSummary.applicantMatchingDatum.hidden
                                ? "Unhide"
                                : "Hide"}{" "}
                            from all courses
                        </ListItemText>
                    </MenuItem>
                </>
            )}
        </>
    );
}
