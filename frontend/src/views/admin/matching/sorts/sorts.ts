import { ApplicantSummary } from "../types";
import { Position } from "../../../../api/defs/types";
import { getPositionPrefForPosition } from "../utils";
import { sum } from "../../../../libs/utils";

export type SortListItem = {
    name: SortType;
    asc: boolean;
};

export type SortType =
    | "Program"
    | "Department"
    | "Year in Progress"
    | "GPA"
    | "TA Preference"
    | "Instructor Preference"
    | "Total Hours Assigned"
    | "Total Hours Owed"
    | "Remaining Hours Owed"
    | "First Name"
    | "Last Name";

type SortFunction = (
    applicantSummaries: ApplicantSummary[],
    asc?: boolean,
    position?: Position | null
) => void;

// A mapping of sort names to their sorting functions
export const sortMap: Record<SortType, SortFunction> = {
    Program: sortByProgram,
    Department: sortByDepartment,
    "Year in Progress": sortByYip,
    GPA: sortByGpa,
    "TA Preference": sortByApplicantPref,
    "Instructor Preference": sortByInstructorRating,
    "Total Hours Assigned": sortByTotalHoursAssigned,
    "Total Hours Owed": sortByTotalHoursOwed,
    "Remaining Hours Owed": sortByRemainingHoursOwed,
    "First Name": sortByFirstName,
    "Last Name": sortByLastName,
};

/**
 * Returns a copy of `applicantSummaries` with a set of sorting functions outlined by `sortList`
 * applied.
 */
export function applySorts(
    applicantSummaries: ApplicantSummary[],
    sortList: SortListItem[],
    position: Position
) {
    // Return early if any inputs aren't defined
    if (applicantSummaries.length === 0 || sortList.length === 0) {
        return [...applicantSummaries];
    }

    const ret: ApplicantSummary[] = [...applicantSummaries];

    // Apply each sort in the opposite order they appear in sortList
    const reversedList = [...sortList].reverse();
    for (const sortItem of reversedList) {
        sortMap[sortItem["name"]](ret, sortItem["asc"], position);
    }

    return ret;
}

// Wrapper function for handling ascending vs. descending sorts
function flipIfDescending(val: number, asc: boolean) {
    return val * (asc ? 1 : -1);
}

// Sorting functions -- all of these do in-place sorting
function sortByFirstName(applicantSummaries: ApplicantSummary[], asc = true, _position?: Position | null) {
    applicantSummaries.sort((a, b) => {
        return `${a.applicantMatchingDatum.applicant.first_name}, ${a.applicantMatchingDatum.applicant.last_name}`.toLowerCase() <=
            `${b.applicantMatchingDatum.applicant.first_name}, ${b.applicantMatchingDatum.applicant.last_name}`.toLowerCase()
            ? flipIfDescending(-1, asc)
            : flipIfDescending(1, asc);
    });
}

function sortByLastName(applicantSummaries: ApplicantSummary[], asc = true, _position?: Position | null) {
    applicantSummaries.sort((a, b) => {
        return `${a.applicantMatchingDatum.applicant.last_name}, ${a.applicantMatchingDatum.applicant.first_name}`.toLowerCase() <=
            `${b.applicantMatchingDatum.applicant.last_name}, ${b.applicantMatchingDatum.applicant.first_name}`.toLowerCase()
            ? flipIfDescending(-1, asc)
            : flipIfDescending(1, asc);
    });
}

function sortByProgram(applicantSummaries: ApplicantSummary[], asc = true, _position?: Position | null) {
    const priority = ["U", "PD", "MScAC", "M", "P"];
    applicantSummaries.sort((a, b) => {
        // Empty entries are treated as lowest priority
        if (!a.application?.program) {
            return flipIfDescending(1, asc);
        }

        if (!b.application?.program) {
            return flipIfDescending(-1, asc);
        }

        // Then "other" responses
        if (priority.indexOf(a.application?.program) === -1) {
            return flipIfDescending(1, asc);
        }

        if (priority.indexOf(b.application?.program) === -1) {
            return flipIfDescending(-1, asc);
        }

        if (a.application?.program === b.application?.program) {
            return 0;
        }

        return priority.indexOf(a.application?.program) <
            priority.indexOf(b.application?.program)
            ? flipIfDescending(-1, asc)
            : flipIfDescending(1, asc);
    });
}

function sortByGpa(applicantSummaries: ApplicantSummary[], asc = true, _position?: Position | null) {
    applicantSummaries.sort((a, b) => {
        if (!a.application?.gpa) {
            return flipIfDescending(-1, asc);
        }

        if (!b.application?.gpa) {
            return flipIfDescending(1, asc);
        }

        if (a.application?.gpa === b.application?.gpa) {
            return 0;
        }

        return a.application?.gpa <= b.application?.gpa
            ? flipIfDescending(-1, asc)
            : flipIfDescending(1, asc);
    });
}

function sortByYip(applicantSummaries: ApplicantSummary[], asc = true, _position?: Position | null) {
    applicantSummaries.sort((a, b) => {
        if (!a.application?.yip) {
            return flipIfDescending(-1, asc);
        }

        if (!b.application?.yip) {
            return flipIfDescending(1, asc);
        }

        if (a.application?.yip === b.application?.yip) {
            return 0;
        }

        return a.application?.yip < b.application?.yip
            ? flipIfDescending(-1, asc)
            : flipIfDescending(1, asc);
    });
}

function sortByDepartment(applicantSummaries: ApplicantSummary[], asc = true, _position?: Position | null) {
    applicantSummaries.sort((a, b) => {
        if (!a.application?.department) {
            return flipIfDescending(-1, asc);
        }

        if (!b.application?.department) {
            return flipIfDescending(1, asc);
        }

        if (a.application?.department === b.application?.department) {
            return 0;
        }

        return a.application?.department < b.application?.department
            ? flipIfDescending(-1, asc)
            : flipIfDescending(1, asc);
    });
}

function sortByApplicantPref(
    applicantSummaries: ApplicantSummary[],
    asc = true,
    currPosition?: Position | null
) {
    applicantSummaries.sort((a, b) => {
        if (!currPosition) {
            return 0;
        }

        const aPref = getPositionPrefForPosition(a.application, currPosition);
        const bPref = getPositionPrefForPosition(b.application, currPosition);

        if (!aPref) {
            return flipIfDescending(-1, asc);
        }

        if (!bPref) {
            return flipIfDescending(1, asc);
        }

        if (aPref === bPref) {
            return 0;
        }

        return aPref.preference_level < bPref.preference_level
            ? flipIfDescending(-1, asc)
            : flipIfDescending(1, asc);
    });
}

function sortByInstructorRating(
    applicantSummaries: ApplicantSummary[],
    asc = true,
    currPosition?: Position | null
) {
    applicantSummaries.sort((a, b) => {
        if (!currPosition) {
            return 0;
        }

        const aInstructorRatings =
            a.application?.instructor_preferences
                .filter((pref) => pref.position.id === currPosition?.id)
                .map((rating) => {
                    return rating.preference_level;
                }) || [];

        const bInstructorRatings =
            b.application?.instructor_preferences
                .filter((pref) => pref.position.id === currPosition?.id)
                .map((rating) => {
                    return rating.preference_level;
                }) || [];

        if (aInstructorRatings.length === 0) {
            return flipIfDescending(-1, asc);
        }

        if (bInstructorRatings.length === 0) {
            return flipIfDescending(1, asc);
        }

        const aAvgRating =
            sum(...aInstructorRatings) / aInstructorRatings.length;
        const bAvgRating =
            sum(...bInstructorRatings) / bInstructorRatings.length;

        if (aAvgRating === bAvgRating) {
            return 0;
        }

        return aAvgRating < bAvgRating
            ? flipIfDescending(-1, asc)
            : flipIfDescending(1, asc);
    });
}

function sortByTotalHoursAssigned(
    applicantSummaries: ApplicantSummary[],
    asc = true,
    _position?: Position | null
) {
    applicantSummaries.sort((a, b) => {
        if (!a.matches) {
            return flipIfDescending(-1, asc);
        }

        if (!b.matches) {
            return flipIfDescending(1, asc);
        }

        if (a.totalHoursAssigned === b.totalHoursAssigned) {
            return 0;
        }

        return a.totalHoursAssigned < b.totalHoursAssigned
            ? flipIfDescending(-1, asc)
            : flipIfDescending(1, asc);
    });
}

function sortByTotalHoursOwed(
    applicantSummaries: ApplicantSummary[],
    asc = true,
    _position?: Position | null
) {
    applicantSummaries.sort((a, b) => {
        const aHours = a.applicantMatchingDatum.min_hours_owed || 0;
        const bHours = b.applicantMatchingDatum.min_hours_owed || 0;

        if (aHours === bHours) {
            return 0;
        }

        return aHours < bHours
            ? flipIfDescending(-1, asc)
            : flipIfDescending(1, asc);
    });
}

function sortByRemainingHoursOwed(
    applicantSummaries: ApplicantSummary[],
    asc = true,
    _position?: Position | null
) {
    applicantSummaries.sort((a, b) => {
        const aHoursOwed = a.applicantMatchingDatum.min_hours_owed || 0;
        const bHoursOwed = b.applicantMatchingDatum.min_hours_owed || 0;

        // Neither applicant has a guarantee to worry about
        if (aHoursOwed === bHoursOwed) {
            return 0;
        }

        const aHoursRemaining =
              aHoursOwed -
              (a.applicantMatchingDatum.prev_hours_fulfilled || 0) -
              (a.totalHoursAssigned || 0);
        const bHoursRemaining =
              bHoursOwed -
              (b.applicantMatchingDatum.prev_hours_fulfilled || 0) -
              (b.totalHoursAssigned || 0);

        if (aHoursRemaining === bHoursRemaining) {
            return 0;
        }

        return aHoursRemaining < bHoursRemaining
            ? flipIfDescending(-1, asc)
            : flipIfDescending(1, asc);
    });
}
