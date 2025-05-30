import type { Utorid } from "./common";
import type {
    Applicant,
    Application,
    Assignment,
    ContractTemplate,
    Instructor,
    Position,
    Posting,
    PostingPosition,
    Session,
    WageChunk,
    InstructorPreference,
    ApplicantMatchingDatum,
    LetterTemplate,
} from "./internal-types";
// Minimal types contain the minimum amount of information needed to reconstruct
// a particular object. They lack IDs and may be flat compared to what is actually used
// by the API

type NoId<T> = Omit<T, "id">;

export type MinimalSession = Omit<
    NoId<Session>,
    "applications_visible_to_instructors"
>;
export type MinimalContractTemplate = NoId<ContractTemplate>;
export type MinimalLetterTemplate = NoId<LetterTemplate>;
export type MinimalInstructor = NoId<Instructor>;
export type MinimalWageChunk = NoId<WageChunk>;
export type MinimalApplicant = NoId<Applicant>;

export interface MinimalPosition
    extends Omit<NoId<Position>, "contract_template" | "instructors"> {
    instructors: Utorid[];
    contract_template: string;
}

export interface MinimalAssignment
    extends Omit<NoId<Assignment>, "wage_chunks" | "position" | "applicant"> {
    utorid: Utorid;
    position_code: string;
    wage_chunks?: MinimalWageChunk[];
}

export interface MinimalDdah {
    position_code: string;
    applicant: Utorid;
    duties: { hours: number; description: string }[];
}

export interface MinimalPostingPosition
    extends Omit<NoId<PostingPosition>, "position" | "posting"> {
    position_code: string;
}

export interface MinimalPosting
    extends Omit<
        NoId<Posting>,
        | "posting_positions"
        | "applications"
        | "availability"
        | "url_token"
        | "open_status"
    > {
    posting_positions: MinimalPostingPosition[];
}

export interface MinimalApplication
    extends Omit<
            NoId<Application>,
            | "posting"
            | "applicant"
            | "position_preferences"
            | "instructor_preferences"
        >,
        MinimalApplicant {
    posting: string | null;
    position_preferences: {
        position_code: string;
        preference_level: number;
        custom_question_answers: unknown | null;
    }[];
    instructor_preferences: MinimalInstructorPreference[];
}

export interface MinimalInstructorPreference
    extends Omit<InstructorPreference, "position" | "application"> {
    position_code: string;
}

export interface MinimalApplicantMatchingDatum
    extends Omit<
        NoId<ApplicantMatchingDatum>,
        | "applicant"
        | "session"
        | "letter_template"
        | "note"
        | "hidden"
        | "max_hours_owed"
        | "min_hours_owed"
        | "prev_hours_fulfilled"
    > {
    utorid: Utorid;
    letter_template: string;
    max_hours_owed: number | null;
    min_hours_owed: number | null;
    prev_hours_fulfilled: number | null;
}
