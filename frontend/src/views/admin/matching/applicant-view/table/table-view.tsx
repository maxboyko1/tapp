import { Match, Position } from "../../../../../api/defs/types";
import { ApplicantSummary } from "../../types";
import { sum, round } from "../../../../../libs/utils";
import React from "react";
import {
    getApplicantMatchForPosition,
    getMatchStatus,
    getPositionPrefForPosition,
} from "../../utils";
import { matchingStatusToString } from "../";
import { AdvancedColumnDef, AdvancedFilterTable } from "../../../../../components/advanced-filter-table";
import { departmentCodes, programCodes } from "../../name-maps";

const DEFAULT_COLUMNS: AdvancedColumnDef<ApplicantSummary>[] = [
    {   
        header: "Status",
        accessorKey: "status"
    },
    {   
        header: "First Name",
        accessorKey: "first_name"
    },
    { 
        header: "Last Name",
        accessorKey: "last_name"
    },
    {   
        header: "UTORid",
        accessorKey: "utorid"
    },
    { 
        header: "Department",
        accessorKey: "department"
    },
    {   
        header: "Program",
        accessorKey: "program"
    },
    {   
        header: "YIP",
        accessorKey: "yip",
        size: 64
    },
    {   
        header: "GPA",
        accessorKey: "gpa",
        size: 64
    },
    {   
        header: "TA Rating",
        accessorKey: "taPreference",
        size: 64
    },
    {
        header: "Instructor Rating",
        accessorKey: "instructorPreference",
        size: 64,
    },
    {
        header: "Assignments",
        accessorKey: "assignments"
    },
    {
        header: "Assigned Hours",
        accessorKey: "totalHoursAssigned",
        size: 64
    },
    {
        header: "Previously Assigned Hours",
        accessorKey: "previousHoursFulfilled",
        size: 64,
    },
    {
        header: "Total Guaranteed Hours",
        accessorKey: "guaranteedHours",
        size: 64,
    },
];

/**
 * A presentation of applicant information in table view, using a AdvancedFilterTable.
 */
export function TableView({
    position,
    applicantSummaries,
}: {
    position: Position;
    applicantSummaries: ApplicantSummary[];
}) {
    const positionPrefsByApplicantId: Record<number, number | null> =
        React.useMemo(() => {
            const ret: Record<number, number | null> = {};
            for (const summary of applicantSummaries) {
                ret[summary.applicantMatchingDatum.applicant.id] =
                    getPositionPrefForPosition(summary.application, position)
                        ?.preference_level || null;
            }

            return ret;
        }, [applicantSummaries, position]);

    const applicantMatchesByApplicantId: Record<number, Match | null> =
        React.useMemo(() => {
            const ret: Record<number, Match | null> = {};
            for (const applicantSummary of applicantSummaries) {
                ret[applicantSummary.applicantMatchingDatum.applicant.id] =
                    getApplicantMatchForPosition(applicantSummary, position);
            }

            return ret;
        }, [applicantSummaries, position]);

    const mappedSummaries = applicantSummaries.map((summary) => {
        const instructorRatings =
            summary.application?.instructor_preferences
                .filter((pref) => pref.position.id === position.id)
                .map((rating) => {
                    return rating.preference_level;
                }) || [];

        const avgInstructorRating =
            instructorRatings.length > 0
                ? round(sum(...instructorRatings) / instructorRatings.length, 3)
                : null;

        const match =
            applicantMatchesByApplicantId[
                summary.applicantMatchingDatum.applicant.id
            ];

        let statusCategory = "";
        if (match) {
            statusCategory =
                matchingStatusToString[getMatchStatus(summary, position)];
            if (
                statusCategory === "Assigned" ||
                statusCategory === "Assigned (Staged)"
            ) {
                statusCategory += ` (${match.hours_assigned || "0"})`;
            }
        }

        return {
            status: statusCategory,
            last_name: summary.applicantMatchingDatum.applicant.last_name,
            first_name: summary.applicantMatchingDatum.applicant.first_name,
            utorid: summary.applicantMatchingDatum.applicant.utorid,
            department: summary.application?.department
                ? departmentCodes[summary.application?.department]
                    ? departmentCodes[summary.application?.department]["full"]
                    : `Other (${summary.application?.department})`
                : "",
            program: summary.application?.program
                ? programCodes[summary.application?.program]
                    ? programCodes[summary.application?.program]["full"]
                    : `Other (${summary.application?.program})`
                : "",
            yip: summary.application?.yip || "",
            gpa: summary.application?.gpa || "",
            taPreference:
                positionPrefsByApplicantId[
                    summary.applicantMatchingDatum.applicant.id
                ],
            instructorPreference: avgInstructorRating,
            assignments: formatAssignedCourses(summary, position),
            totalHoursAssigned: summary.totalHoursAssigned,
            previousHoursFulfilled:
                summary.applicantMatchingDatum.prev_hours_fulfilled,
            guaranteedHours: `${
                summary.applicantMatchingDatum.min_hours_owed
                    ? `${summary.applicantMatchingDatum.min_hours_owed}
                ${
                    summary.applicantMatchingDatum.max_hours_owed
                        ? ` - ${summary.applicantMatchingDatum.max_hours_owed}`
                        : ""
                }`
                    : ""
            }`,
        };
    });

    return (
        <AdvancedFilterTable columns={DEFAULT_COLUMNS} data={mappedSummaries} />
    );
}

/**
 * Takes an applicant summary and returns a formatted string containing
 * the applicant's assignments and hours assigned, separated by newlines.
 */
function formatAssignedCourses(
    applicantSummary: ApplicantSummary,
    position: Position
) {
    return applicantSummary.matches
        .map((match) => {
            const applicantMatch = getApplicantMatchForPosition(
                applicantSummary,
                position
            );
            const matchStatus = getMatchStatus(applicantSummary, position);
            if (
                matchStatus === "assigned" ||
                matchStatus === "staged-assigned"
            ) {
                return `${position.position_code} (${
                    applicantMatch?.hours_assigned || 0
                })`;
            }
            return null;
        })
        .filter((match) => match)
        .join("\n");
}
