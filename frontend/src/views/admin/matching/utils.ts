import { Position, Application, Match } from "../../../api/defs/types";
import { ApplicantSummary, MatchStatus } from "./types";

/**
 * Returns an existing match for a given applicant summary and position, or null if one does not exist.
 */
export function getApplicantMatchForPosition(
    applicantSummary: ApplicantSummary,
    position: Position
) {
    return (
        applicantSummary.matches.find(
            (match) => match.position.position_code === position.position_code
        ) || null
    );
}

/**
 * Return an existing match for a given applicant summary and position, or creates a new one if it does not exist.
 */
export function prepApplicantMatchForPosition(
    applicantSummary: ApplicantSummary,
    position: Position
): Match {
    const applicantMatch = getApplicantMatchForPosition(
        applicantSummary,
        position
    );
    if (applicantMatch) return applicantMatch;

    return {
        applicant: applicantSummary.applicantMatchingDatum.applicant,
        position: position,
        assigned: false,
        starred: false,
        hidden: false,
        hours_assigned: 0,
    };
}

export function getPositionPrefForPosition(
    application: Application | null,
    position: Position
) {
    if (!application) {
        return null;
    }

    return (
        application.position_preferences?.find(
            (positionPref) => positionPref.position.id === position.id
        ) || null
    );
}

/**
 * Returns the MatchStatus of an applicant given their applicant summary and a position.
 */
export function getMatchStatus(
    applicantSummary: ApplicantSummary,
    position: Position
): MatchStatus {
    // Check if assigned
    for (const assignment of applicantSummary.assignments) {
        if (assignment.position.id === position.id) {
            if (
                assignment.active_offer_status === "rejected" ||
                assignment.active_offer_status === "withdrawn"
            )
                return "unassignable";
            return "assigned";
        }
    }

    // Check for a match with at least one set flag
    for (const match of applicantSummary.matches) {
        if (match.position.id === position.id) {
            if (match.assigned) return "staged-assigned";
            if (match.starred) return "starred";
            if (match.hidden) return "hidden";
        }
    }

    // Check if globally hidden:
    if (applicantSummary.applicantMatchingDatum.hidden) return "hidden";

    // No match exists, so check if they applied to the position
    for (const positionPref of applicantSummary.application
        ?.position_preferences || []) {
        if (positionPref.position.id === position.id) return "applied";
    }

    return "n/a";
}

/**
 * Returns the number of hours an applicant was assigned (or staged-assigned) to a position.
 */
export function getHoursAssigned(
    applicantSummary: ApplicantSummary,
    position: Position
) {
    for (const assignment of applicantSummary.assignments) {
        if (assignment.position.id === position.id) {
            if (
                assignment.active_offer_status === "withdrawn" ||
                assignment.active_offer_status === "rejected"
            )
                return 0;
            return assignment.hours;
        }
    }

    for (const match of applicantSummary.matches) {
        if (match.position.id === position.id) {
            if (match.assigned) return match.hours_assigned || 0;
            return 0;
        }
    }

    return 0;
}
