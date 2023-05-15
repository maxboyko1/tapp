import { RootState } from "../../../rootReducer";
import { createSelector } from "reselect";
import { round } from "../../../libs/utils";
import {
    applicationsSelector,
    assignmentsSelector,
    positionsSelector,
    applicantsSelector,
    matchesSelector,
    applicantMatchingDataSelector,
    activeSessionSelector,
} from "../../../api/actions";

import {
    Assignment,
    Application,
    Match,
    ApplicantMatchingDatum,
} from "../../../api/defs/types";

import {
    SET_SELECTED_MATCHING_POSITION,
    SET_APPLICANT_VIEW_MODE,
} from "./constants";

import {
    PositionSummary,
    ApplicantSummary,
    ApplicantViewMode,
    FillStatus,
} from "./types";

import { getHoursAssigned } from "./utils";
import { actionFactory } from "../../../api/actions/utils";

export const setSelectedMatchingPosition = actionFactory<number | null>(
    SET_SELECTED_MATCHING_POSITION
);

export const setApplicantViewMode = actionFactory<ApplicantViewMode>(
    SET_APPLICANT_VIEW_MODE
);

// selectors
export const selectedMatchingPositionSelector = (state: RootState) =>
    state.ui.matchingData.selectedMatchingPositionId;
export const applicantViewModeSelector = (state: RootState) =>
    state.ui.matchingData.applicantViewMode;

// Consolidates the most recent application for each posting for each applicant
export const combinedApplicationsSelector = createSelector(
    [applicantsSelector, applicationsSelector],
    (applicants, applications) => {
        if (applications.length === 0 || applicants.length === 0) {
            return [];
        }

        const applicationsByApplicantId: Record<number, Application[]> = {};
        for (const application of applications) {
            applicationsByApplicantId[application.applicant.id] =
                applicationsByApplicantId[application.applicant.id] || [];
            applicationsByApplicantId[application.applicant.id].push(
                application
            );
        }

        return applicants
            .map((applicant) => {
                const matchingApplications =
                    applicationsByApplicantId[applicant.id];

                if (
                    !matchingApplications ||
                    matchingApplications.length === 0
                ) {
                    return null;
                }

                // Separate applications by posting
                const applicationsByPosting: Record<number, Application[]> = {};
                for (const application of matchingApplications) {
                    // Handle case where posting is null (pretend id is -1)
                    let postingId = -1;
                    if (application.posting) {
                        postingId = application.posting.id;
                    }
                    applicationsByPosting[postingId] =
                        applicationsByPosting[postingId] || [];
                    applicationsByPosting[postingId].push(application);
                }

                // Sort each bucket:
                let combinedApplication: Application | null = null;
                for (const applications of Object.values(
                    applicationsByPosting
                )) {
                    applications.sort((a, b) => {
                        if (a.submission_date === b.submission_date) {
                            return 0;
                        }
                        if (a.submission_date > b.submission_date) {
                            return 1;
                        }
                        return -1;
                    });

                    const newestApplication =
                        applications[applications.length - 1];
                    if (!combinedApplication) {
                        combinedApplication = newestApplication;
                    } else {
                        // Update values to include info from this application
                        for (const positionPref of newestApplication.position_preferences) {
                            const matchingPref =
                                combinedApplication.position_preferences.find(
                                    (pref) =>
                                        pref.position.position_code ===
                                        positionPref.position.position_code
                                ) || null;

                            if (!matchingPref) {
                                combinedApplication.position_preferences.push(
                                    positionPref
                                );
                            } else {
                                // Update position preference to take the maximum of the two
                                matchingPref.preference_level = Math.max(
                                    positionPref.preference_level,
                                    matchingPref.preference_level
                                );
                            }
                        }
                        for (const instrPref of newestApplication.instructor_preferences) {
                            combinedApplication.instructor_preferences =
                                combinedApplication.instructor_preferences ||
                                [];
                            combinedApplication.instructor_preferences.push(
                                instrPref
                            );
                        }
                    }
                }

                return combinedApplication;
            })
            .filter((application) => !!application);
    }
);

const applicantSummariesSelector = createSelector(
    [
        applicantsSelector,
        assignmentsSelector,
        applicantMatchingDataSelector,
        matchesSelector,
        combinedApplicationsSelector,
        activeSessionSelector,
    ],
    (
        applicants,
        assignments,
        applicantMatchingData,
        matches,
        applications,
        activeSession
    ) => {
        const ret: ApplicantSummary[] = [];
        if (activeSession == null) return ret;

        const applicationsByApplicantId: Record<number, Application | null> =
            {};
        for (const application of applications) {
            if (application) {
                applicationsByApplicantId[application.applicant.id] =
                    application;
            }
        }

        const assignmentsByApplicantId: Record<number, Assignment[]> = {};
        for (const assignment of assignments) {
            assignmentsByApplicantId[assignment.applicant.id] =
                assignmentsByApplicantId[assignment.applicant.id] || [];
            assignmentsByApplicantId[assignment.applicant.id].push(assignment);
        }

        const applicantMatchingDataByApplicantId: Record<
            number,
            ApplicantMatchingDatum
        > = {};
        for (const applicantMatchingDatum of applicantMatchingData) {
            applicantMatchingDataByApplicantId[
                applicantMatchingDatum.applicant.id
            ] = applicantMatchingDatum;
        }

        const matchesByApplicantId: Record<number, Match[]> = {};
        for (const match of matches) {
            matchesByApplicantId[match.applicant.id] =
                matchesByApplicantId[match.applicant.id] || [];
            matchesByApplicantId[match.applicant.id].push(match);
        }

        for (const applicant of applicants) {
            let hoursAssigned = 0;

            for (const assignment of assignmentsByApplicantId[applicant.id] ||
                []) {
                if (
                    assignment.active_offer_status !== "rejected" &&
                    assignment.active_offer_status !== "withdrawn"
                ) {
                    hoursAssigned += assignment.hours;
                }
            }

            for (const match of matchesByApplicantId[applicant.id] || []) {
                // Do not double-count if the applicant already has an existing assignment
                if (
                    match.assigned &&
                    !assignmentsByApplicantId[applicant.id]?.find(
                        (assignment) =>
                            assignment.position.id === match.position.id &&
                            assignment.active_offer_status !== "rejected" &&
                            assignment.active_offer_status !== "withdrawn"
                    )
                )
                    hoursAssigned += match.hours_assigned || 0;
            }

            let filledStatus: FillStatus = "n/a";
            if (applicantMatchingDataByApplicantId[applicant.id] || [])
                filledStatus = getFilledStatus(
                    applicantMatchingDataByApplicantId[applicant.id]
                        ?.min_hours_owed || 0,
                    hoursAssigned
                );

            ret.push({
                applicantMatchingDatum: applicantMatchingDataByApplicantId[
                    applicant.id
                ] || {
                    applicant: applicant,
                    session: activeSession,
                },
                application: applicationsByApplicantId[applicant.id] || null,
                matches: matchesByApplicantId[applicant.id] || [],
                assignments: assignmentsByApplicantId[applicant.id] || [],
                totalHoursAssigned: hoursAssigned,
                filledStatus: filledStatus,
            });
        }
        return ret;
    }
);

function getFilledStatus(
    targetHours: number,
    hoursAssigned: number
): FillStatus {
    if (targetHours === 0 && hoursAssigned === 0) {
        return "n/a";
    } else if (targetHours > 0 && hoursAssigned === 0) {
        return "empty";
    } else if (targetHours - hoursAssigned > 0) {
        return "under";
    } else if (targetHours - hoursAssigned === 0) {
        return "matched";
    }
    return "over";
}

export const positionSummariesByIdSelector = createSelector(
    [positionsSelector, applicantSummariesSelector],
    (positions, applicantSummaries) => {
        const ret: Record<number, PositionSummary> = [];
        const applicantSummariesByPosition: Record<number, ApplicantSummary[]> =
            {};

        for (const applicantSummary of applicantSummaries) {
            // Add the applicant summary to any position where the applicant has an existing assignment
            for (const assignment of applicantSummary.assignments) {
                applicantSummariesByPosition[assignment.position.id] =
                    applicantSummariesByPosition[assignment.position.id] || [];
                applicantSummariesByPosition[assignment.position.id].push(
                    applicantSummary
                );
            }

            // Add for any existing matches, but only if at least one flag is set
            for (const match of applicantSummary.matches) {
                if (match.assigned || match.starred || match.hidden) {
                    applicantSummariesByPosition[match.position.id] =
                        applicantSummariesByPosition[match.position.id] || [];
                    if (
                        applicantSummariesByPosition[match.position.id].indexOf(
                            applicantSummary
                        ) === -1
                    )
                        applicantSummariesByPosition[match.position.id].push(
                            applicantSummary
                        );
                }
            }

            // Add any positions that the applicant has applied to
            for (const positionPref of applicantSummary.application?.position_preferences.filter(
                (pref) => pref.preference_level !== 0
            ) || []) {
                applicantSummariesByPosition[positionPref.position.id] =
                    applicantSummariesByPosition[positionPref.position.id] ||
                    [];

                if (
                    applicantSummariesByPosition[
                        positionPref.position.id
                    ].indexOf(applicantSummary) === -1
                )
                    applicantSummariesByPosition[positionPref.position.id].push(
                        applicantSummary
                    );
            }
        }

        for (const position of positions) {
            const targetHours = round(
                position.hours_per_assignment *
                    (position.desired_num_assignments || 0),
                2
            );

            // Go over matches marked as assigned/staged-assigned and get the number of hours assigned
            let hoursAssigned = 0;

            for (const applicantSummary of applicantSummariesByPosition[
                position.id
            ] || []) {
                hoursAssigned += getHoursAssigned(applicantSummary, position);
            }

            let filledStatus: FillStatus = "empty";
            if (targetHours > 0 && hoursAssigned === 0) {
                filledStatus = "empty";
            } else if (targetHours - hoursAssigned > 0) {
                filledStatus = "under";
            } else if (targetHours - hoursAssigned === 0) {
                filledStatus = "matched";
            } else if (targetHours - hoursAssigned < 0) {
                filledStatus = "over";
            }

            ret[position.id] = {
                position: position,
                hoursAssigned: hoursAssigned,
                filledStatus: filledStatus,
                applicantSummaries:
                    applicantSummariesByPosition[position.id] || [],
            };
        }

        return ret;
    }
);
