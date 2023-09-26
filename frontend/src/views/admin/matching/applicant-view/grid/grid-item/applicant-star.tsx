import React from "react";
import classNames from "classnames";
import { Position } from "../../../../../../api/defs/types";
import { toggleStarred } from "../../../match-actions/modify-match-status";
import { BsStarFill } from "react-icons/bs";
import { ApplicantSummary } from "../../../types";
import { useThunkDispatch } from "../../../../../../libs/thunk-dispatch";
import { getMatchStatus } from "../../../utils";

/**
 * A button for toggling applicant's "starred" status for the currently-selected position.
 */
export function ApplicantStar({
    applicantSummary,
    position,
}: {
    applicantSummary: ApplicantSummary;
    position: Position;
}) {
    const matchStatus = getMatchStatus(applicantSummary, position);
    const dispatch = useThunkDispatch();

    async function _toggleStarred() {
        await dispatch(toggleStarred(applicantSummary, position));
    }

    return (
        <BsStarFill
            className={classNames("star-icon", {
                filled: matchStatus === "starred",
            })}
            onClick={_toggleStarred}
        />
    );
}
