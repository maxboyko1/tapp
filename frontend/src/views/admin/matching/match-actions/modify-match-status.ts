import {
    upsertApplicantMatchingDatum,
    upsertMatch,
} from "../../../../api/actions";
import { ApplicantSummary } from "../types";
import { ApplicantMatchingDatum, Position } from "../../../../api/defs/types";
import { prepApplicantMatchForPosition } from "../utils";

/**
 * Toggle the "stagedAssigned" status of a match.
 */
export function toggleAssigned(
    applicantSummary: ApplicantSummary,
    position: Position,
    hoursAssigned?: number
) {
    const applicantMatch = prepApplicantMatchForPosition(
        applicantSummary,
        position
    );
    applicantMatch.assigned = !applicantMatch.assigned;
    applicantMatch.hours_assigned = hoursAssigned || 0;
    return upsertMatch(applicantMatch);
}

/**
 * Toggle the "starred" status of a match.
 */
export function toggleStarred(
    applicantSummary: ApplicantSummary,
    position: Position
) {
    const applicantMatch = prepApplicantMatchForPosition(
        applicantSummary,
        position
    );
    applicantMatch.starred = !applicantMatch.starred;

    return upsertMatch(applicantMatch);
}

/**
 * Toggle a match's "hidden" status for a given applicant and position.
 */
export function toggleHidden(
    applicantSummary: ApplicantSummary,
    position: Position
) {
    const applicantMatch = prepApplicantMatchForPosition(
        applicantSummary,
        position
    );
    applicantMatch.hidden = !applicantMatch.hidden;
    return upsertMatch(applicantMatch);
}

/**
 * Toggles an applicant's global "hidden" match status
 */
export function toggleApplicantHidden(
    applicantMatchingDatum: ApplicantMatchingDatum
) {
    return upsertApplicantMatchingDatum({
        ...applicantMatchingDatum,
        hidden: !applicantMatchingDatum.hidden,
    });
}
