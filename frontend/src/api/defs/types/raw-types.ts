/**
 * This file contains types that are returned by the backend as responses to API calls.
 */
import type { CustomQuestions, HasId, UserRole, Utorid } from "./common";

export interface RawSession extends HasId {
    start_date: string;
    end_date: string;
    name: string;
    rate1: number;
    rate2: number | null;
    applications_visible_to_instructors: boolean;
}

export interface RawPosition extends HasId {
    position_code: string;
    position_title: string | null;
    hours_per_assignment: number;
    start_date: string;
    end_date: string;
    contract_template_id: number;
    qualifications: string | null;
    duties: string | null;
    custom_questions: CustomQuestions;
    desired_num_assignments: number | null;
    current_enrollment: number | null;
    current_waitlisted: number | null;
    instructor_ids: number[];
    session_id: number;
}

export interface RawApplicant extends HasId {
    utorid: Utorid;
    student_number: string | null;
    first_name: string;
    last_name: string | null;
    email: string | null;
    phone: string | null;
}

export interface RawApplication extends HasId {
    applicant_id: number;
    posting_id: number | null;
    comments: string | null;
    program: string | null;
    department: string | null;
    cv_link: string | null;
    yip: number | null;
    gpa: number | null;
    custom_question_answers: unknown | null;
    annotation: string | null;
    documents: {
        name: string;
        type: string;
        size: number;
        url_token: string;
    }[];
    position_preferences: { 
        position_id: number;
        preference_level: number;
        custom_question_answers: unknown | null; 
    }[];
    submission_date: string;
}

export interface RawAssignment extends HasId {
    applicant_id: number;
    position_id: number;
    start_date: string;
    end_date: string;
    note: string | null;
    contract_override_pdf: string | null;
    active_offer_status:
        | "accepted"
        | "rejected"
        | "withdrawn"
        | "provisional"
        | "pending"
        | "no_offer"
        | null;
    active_offer_url_token: string | null;
    active_offer_recent_activity_date: string | null;
    active_offer_nag_count: number | null;
    hours: number;
}

export interface RawInstructor extends HasId {
    first_name: string;
    last_name: string | null;
    email: string | null;
    utorid: Utorid;
}

/**
 * A duty that is part of a DDAH.
 *
 * @export
 * @interface RawDuty
 */
export interface RawDuty {
    order: number;
    hours: number;
    description: string;
}

export interface RawDdah extends HasId {
    assignment_id: number;
    approved_date: string | null;
    accepted_date: string | null;
    revised_date: string | null;
    emailed_date: string | null;
    signature: string | null;
    url_token: string;
    duties: RawDuty[];
}

export interface RawDdahDetails {
    approved_date: string | null;
    accepted_date: string | null;
    revised_date: string | null;
    emailed_date: string | null;
    position_code: string;
    position_title: string | null;
    status: "acknowledged" | "unacknowledged";
}

export interface RawPosting extends HasId {
    name: string;
    intro_text: string | null;
    open_date: string | null;
    close_date: string | null;
    availability: "auto" | "open" | "closed";
    custom_questions: CustomQuestions;
    application_ids: number[];
    url_token: string;
    open_status: boolean;
}

export interface RawPostingPosition {
    position_id: number;
    posting_id: number;
    hours: number | null;
    num_positions: number | null;
}

export interface RawContractTemplate extends HasId {
    template_file: string;
    template_name: string;
}

export interface RawLetterTemplate extends HasId {
    template_file: string;
    template_name: string;
}

export interface RawWageChunk extends HasId {
    assignment_id: number;
    start_date: string;
    end_date: string;
    hours: number;
    rate: number;
}

export interface RawAttachment {
    file_name: string;
    mime_type: string;
    content: string;
}

export interface RawConfirmation extends HasId {
    applicant_matching_datum_id: number;
    first_name: string;
    last_name: string;
    email: string;
    ta_coordinator_name: string;
    ta_coordinator_email: string;
    signature: string | null;
    emailed_date: string | null;
    accepted_date: string | null;
    rejected_date: string | null;
    withdrawn_date: string | null;
    url_token: string;
    nag_count: number;
    status: "provisional" | "pending" | "accepted" | "rejected" | "withdrawn";
    min_hours_owed: number;
    max_hours_owed: number;
    prev_hours_fulfilled: number;
}

export interface RawOffer extends HasId {
    assignment_id: number;
    first_name: string;
    last_name: string;
    email: string;
    position_code: string;
    position_title: string;
    position_start_date: string;
    position_end_date: string;
    first_time_ta: boolean | null;
    instructor_contact_desc: string;
    pay_period_desc: string;
    installments: null;
    ta_coordinator_name: string;
    ta_coordinator_email: string;
    signature: string | null;
    emailed_date: string | null;
    accepted_date: string | null;
    rejected_date: string | null;
    withdrawn_date: string | null;
    url_token: string;
    nag_count: number;
    status: "provisional" | "pending" | "accepted" | "rejected" | "withdrawn";
    hours: number;
}

export interface RawUser extends HasId {
    utorid: Utorid;
    roles: UserRole[];
}

export interface RawReportingTag {
    name: string;
}

export interface RawInstructorPreference {
    application_id: number;
    position_id: number;
    preference_level: number;
    comment: string;
}

export interface RawApplicantMatchingDatum extends HasId {
    applicant_id: number;
    session_id: number;
    letter_template_id: number;
    max_hours_owed: number | null;
    min_hours_owed: number | null;
    prev_hours_fulfilled: number | null;
    active_confirmation_status:
        | "accepted"
        | "rejected"
        | "withdrawn"
        | "provisional"
        | "pending"
        | "no_letter"
        | null;
    active_confirmation_url_token: string | null;
    active_confirmation_recent_activity_date: string | null;
    active_confirmation_nag_count: number | null;
    note: string | null;
    hidden: boolean;
}

export interface RawMatch {
    applicant_id: number;
    position_id: number;
    hours_assigned: number | null;
    assigned: boolean;
    starred: boolean;
    hidden: boolean;
}
