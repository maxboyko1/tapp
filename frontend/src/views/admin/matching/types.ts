import {
    Position,
    Application,
    ApplicantMatchingDatum,
    Match,
    Assignment,
} from "../../../api/defs/types";

export type ApplicantSummary = {
    applicantMatchingDatum: ApplicantMatchingDatum;
    application: Application | null;
    matches: Match[];
    assignments: Assignment[];
    totalHoursAssigned: number;
    filledStatus: FillStatus;
};

export type PositionSummary = {
    position: Position;
    hoursAssigned: number;
    filledStatus: FillStatus;
    applicantSummaries: ApplicantSummary[];
};

export type ApplicantViewMode = "table" | "grid";
export type MatchStatus =
    | "applied"
    | "starred"
    | "staged-assigned"
    | "assigned"
    | "unassignable"
    | "hidden"
    | "n/a";
export type FillStatus = "empty" | "under" | "matched" | "over" | "n/a";
