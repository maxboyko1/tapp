import React from "react";
import { ApplicantSummary } from "../../../types";
import { Position } from "../../../../../../api/defs/types";
import { sum, round } from "../../../../../../libs/utils";
import {
    getHoursAssigned,
    getMatchStatus,
    getPositionPrefForPosition,
} from "../../../utils";
import { ApplicantNote } from "./applicant-note";
import { ApplicantStar } from "./applicant-star";
import { departmentCodes, programCodes } from "../../../name-maps";

/**
 * The main body of a grid item, presenting most of the information for an applicant.
 */
export function ApplicantPillMiddle({
    applicantSummary,
    position,
}: {
    applicantSummary: ApplicantSummary;
    position: Position;
}) {
    const positionPref = React.useMemo(() => {
        return getPositionPrefForPosition(
            applicantSummary.application,
            position
        );
    }, [applicantSummary, position]);

    const instructorRatings = React.useMemo(() => {
        if (!applicantSummary.application?.instructor_preferences) {
            return [];
        }

        return applicantSummary.application.instructor_preferences
            .filter((pref) => pref.position.id === position.id)
            .map((rating) => {
                return rating.preference_level;
            });
    }, [applicantSummary, position]);

    const avgInstructorRating =
        instructorRatings.length > 0
            ? round(sum(...instructorRatings) / instructorRatings.length, 3)
            : null;

    const deptCode = applicantSummary.application?.department
        ? departmentCodes[applicantSummary.application.department]
        : null;

    const progCode = applicantSummary.application?.program
        ? programCodes[applicantSummary.application.program]
        : null;

    return (
        <div className="applicant-pill-middle">
            <div className="grid-row">
                <div className="applicant-name">
                    {`${applicantSummary.applicantMatchingDatum.applicant.first_name} ${applicantSummary.applicantMatchingDatum.applicant.last_name}`}
                </div>
            </div>
            <div className="grid-row">
                <div
                    className="grid-detail-small"
                    title={
                        deptCode
                            ? deptCode["full"]
                            : applicantSummary.application?.department
                            ? `Other (${applicantSummary.application?.department})`
                            : ""
                    }
                >
                    {deptCode
                        ? deptCode["abbrev"]
                        : applicantSummary.application?.department
                        ? "o"
                        : ""}
                </div>
                <div
                    className="grid-detail-small"
                    title={
                        progCode
                            ? progCode["full"]
                            : applicantSummary.application?.program
                            ? `Other (${applicantSummary.application?.program})`
                            : ""
                    }
                >
                    {progCode
                        ? progCode["abbrev"]
                        : applicantSummary.application?.program
                        ? "o"
                        : ""}
                    {applicantSummary.application?.yip}
                </div>
                <div
                    className="grid-detail-small"
                    title="TA's preference level"
                >
                    {positionPref?.preference_level}
                </div>
                <div
                    className="grid-detail-small"
                    title="Average instructor rating"
                >
                    {avgInstructorRating || ""}
                </div>
            </div>
        </div>
    );
}

export function ApplicantPillRight({
    applicantSummary,
    position,
}: {
    applicantSummary: ApplicantSummary;
    position: Position;
}) {
    const isAssigned = ["assigned", "staged-assigned"].includes(
        getMatchStatus(applicantSummary, position)
    );

    return (
        <div className="applicant-pill-right">
            <div className="grid-row">
                {isAssigned ? (
                    <div className="applicant-hours">
                        ({getHoursAssigned(applicantSummary, position)})
                    </div>
                ) : (
                    <div
                        className="icon-container"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                    >
                        <ApplicantStar
                            applicantSummary={applicantSummary}
                            position={position}
                        />
                    </div>
                )}
            </div>
            <div className="grid-row">
                <div
                    className="icon-container"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                >
                    <ApplicantNote applicantSummary={applicantSummary} />
                </div>
            </div>
        </div>
    );
}
