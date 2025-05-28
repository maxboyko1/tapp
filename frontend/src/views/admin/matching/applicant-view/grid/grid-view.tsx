import React from "react";
import LockIcon from "@mui/icons-material/Lock";
import { Tooltip } from "@mui/material";

import { Position } from "../../../../../api/defs/types";
import { ApplicantSummary, MatchStatus } from "../../types";
import { getMatchStatus } from "../../utils";
import { ConnectedApplicantPill } from "./grid-item";
import { matchingStatusToString } from "../";

/**
 * A presentation of applicants and their summaries in a grid-based view.
 * Applicants are divided into sections based on match status (e.g., applied, staged-assigned).
 */
export function GridView({
    position,
    applicantSummaries,
}: {
    position: Position;
    applicantSummaries: ApplicantSummary[];
}) {
    const applicantSummariesByMatchStatus: Record<
        MatchStatus,
        ApplicantSummary[]
    > = React.useMemo(() => {
        const ret: Record<MatchStatus, ApplicantSummary[]> = {
            applied: [],
            starred: [],
            "staged-assigned": [],
            assigned: [],
            unassignable: [],
            hidden: [],
            "n/a": [],
        };

        for (const applicantSummary of applicantSummaries) {
            const applicantMatchStatus = getMatchStatus(
                applicantSummary,
                position
            );
            ret[applicantMatchStatus] = ret[applicantMatchStatus] || [];
            ret[applicantMatchStatus].push(applicantSummary);
        }

        return ret;
    }, [applicantSummaries, position]);

    const statusList: MatchStatus[] = [
        "assigned",
        "staged-assigned",
        "starred",
        "applied",
        "unassignable",
        "hidden",
    ];

    return (
        <React.Fragment>
            {statusList.map((status) => {
                return (
                    <GridSection
                        key={status}
                        status={status}
                        applicantSummaries={
                            applicantSummariesByMatchStatus[status]
                        }
                        position={position}
                    />
                );
            })}
        </React.Fragment>
    );
}

/**
 * A section/collection of grid items for a specified match status (e.g., applied, staged-assigned).
 */
function GridSection({
    status,
    applicantSummaries,
    position,
}: {
    status: MatchStatus;
    applicantSummaries: ApplicantSummary[];
    position: Position;
}) {
    // Don't show the section if there are no applicants
    if (applicantSummaries.length === 0) {
        return null;
    }

    return (
        <div className="grid-view-section">
            <h4>
                {matchingStatusToString[status]}
                {status === "assigned" && (
                    <Tooltip
                        title="These assignments can only be changed through the Assignments & Positions > Assignments tab."
                        placement="right"
                    >
                        <LockIcon className="header-lock" fontSize="small" />
                    </Tooltip>
                )}
                {status === "unassignable" && (
                    <Tooltip
                        title="These applicants have an assignment for this position that was previously rejected/withdrawn, and can only be changed through the Assignments & Positions > Assignments tab."
                        placement="right"
                    >
                        <LockIcon className="header-lock" fontSize="small" />
                    </Tooltip>
                )}
            </h4>
            <div className="grid-view-list">
                {applicantSummaries.map((applicantSummary) => {
                    return (
                        <ConnectedApplicantPill
                            applicantSummary={applicantSummary}
                            position={position}
                            key={
                                applicantSummary.applicantMatchingDatum
                                    .applicant.id
                            }
                        />
                    );
                })}
            </div>
        </div>
    );
}
