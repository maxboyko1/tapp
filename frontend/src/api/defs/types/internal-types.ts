/**
 * Internal types are those that are returned by the reducers, etc. when
 * querying from the Redux store. They may differ from the raw API payloads
 * (whose types are defined in the `raw-types.ts` file.)
 */
import type { UserRole } from "./common";
import type {
    RawApplicant,
    RawApplication,
    RawLetterTemplate,
    RawAssignment,
    RawContractTemplate,
    RawDdah,
    RawDuty,
    RawInstructor,
    RawOffer,
    RawConfirmation,
    RawPosition,
    RawPosting,
    RawPostingPosition,
    RawSession,
    RawUser,
    RawWageChunk,
    RawInstructorPreference,
    RawApplicantMatchingDatum,
    RawMatch,
} from "./raw-types";

export type Duty = RawDuty;
export type Offer = RawOffer;
export type Confirmation = RawConfirmation;
export type WageChunk = Omit<RawWageChunk, "assignment_id">;
export type LetterTemplate = RawLetterTemplate;
export type ContractTemplate = RawContractTemplate;
export type Instructor = RawInstructor;
export type Applicant = RawApplicant;
export type Session = RawSession;
export type User = RawUser;

export interface Ddah extends Omit<RawDdah, "assignment_id"> {
    assignment: Assignment;
    duties: Duty[];
    total_hours: number;
    status: "accepted" | "emailed" | null;
}

export interface Assignment
    extends Omit<RawAssignment, "applicant_id" | "position_id"> {
    applicant: Applicant;
    position: Position;
    wage_chunks?: WageChunk[];
    offers?: Offer[];
}

export interface Position
    extends Omit<RawPosition, "contract_template_id" | "instructor_ids"> {
    contract_template: ContractTemplate;
    instructors: Instructor[];
}

export interface ActiveUser extends Omit<User, "id"> {
    id: number | null;
    active_role: UserRole;
}

export interface Posting extends Omit<RawPosting, "application_ids"> {
    posting_positions: PostingPosition[];
    applications: Application[];
}

export interface Application
    extends Omit<
        RawApplication,
        "applicant_id" | "posting_id" | "position_preferences"
    > {
    applicant: Applicant;
    posting: Posting | null;
    position_preferences: { 
        position: Position;
        preference_level: number;
        custom_question_answers: unknown | null; 
    }[];
    instructor_preferences: InstructorPreference[];
}

export interface PostingPosition
    extends Omit<RawPostingPosition, "position_id" | "posting_id"> {
    position: Position;
    posting: Posting;
}

export interface InstructorPreference
    extends Omit<RawInstructorPreference, "position_id" | "application_id"> {
    position: Position;
    application: Application;
}

export interface ApplicantMatchingDatum
    extends Omit<RawApplicantMatchingDatum, "applicant_id" | "session_id" | "letter_template_id"> {
    applicant: Applicant;
    session: Session;
    letter_template: LetterTemplate;
    confirmations?: Confirmation[];
}

export interface Match extends Omit<RawMatch, "applicant_id" | "position_id"> {
    applicant: Applicant;
    position: Position;
}
