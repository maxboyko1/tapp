import React from "react";
import { ApplicantSummary } from "../../../types";
import { Application, Position } from "../../../../../../api/defs/types";
import { Dropdown } from "react-bootstrap";
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
}: {
    applicantSummary: ApplicantSummary;
    position: Position;
    setShownApplication: (shownApplication: Application | null) => void;
    setShowChangeHours: (show: boolean) => void;
    setShowNote: (show: boolean) => void;
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
            <Dropdown.Item
                onClick={() =>
                    setShownApplication(applicantSummary.application)
                }
            >
                View application details
            </Dropdown.Item>
            <Dropdown.Item onClick={() => setShowNote(true)}>
                View/edit applicant notes
            </Dropdown.Item>

            {matchStatus === "staged-assigned" && (
                <>
                    <Dropdown.Item onClick={() => setShowChangeHours(true)}>
                        Change assigned hours
                    </Dropdown.Item>
                </>
            )}
            {(canBeAssigned || matchStatus === "staged-assigned") && (
                <>
                    <Dropdown.Item onClick={_toggleAssigned}>
                        {canBeAssigned ? "Assign to " : "Unassign from "}
                        <b>{position.position_code}</b>
                        {canBeAssigned
                            ? ` (${position.hours_per_assignment || 0})`
                            : ""}
                    </Dropdown.Item>
                </>
            )}
            {canBeStarred && (
                <Dropdown.Item onClick={_toggleStarred}>
                    {applicantMatch.starred ? "Star for " : "Unstar from "}
                    <b>{position.position_code}</b>
                </Dropdown.Item>
            )}
            {canBeHidden && (
                <>
                    <Dropdown.Item onClick={_toggleHidden}>
                        {applicantMatch.hidden ? "Unhide " : "Hide "} from{" "}
                        <b>{position.position_code}</b>
                    </Dropdown.Item>
                    <Dropdown.Item onClick={_toggleApplicantHidden}>
                        {applicantSummary.applicantMatchingDatum.hidden
                            ? "Unhide"
                            : "Hide"}{" "}
                        from all courses
                    </Dropdown.Item>
                </>
            )}
        </>
    );
}
