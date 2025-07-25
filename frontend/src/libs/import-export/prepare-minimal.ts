/*
 * A collection of utility functions for use when exporting data.
 */

import {
    WageChunk,
    Session,
    Position,
    Instructor,
    Assignment,
    ContractTemplate,
    LetterTemplate,
    Applicant,
    MinimalWageChunk,
    MinimalSession,
    MinimalPosition,
    MinimalInstructor,
    MinimalAssignment,
    MinimalContractTemplate,
    MinimalLetterTemplate,
    MinimalApplicant,
    MinimalDdah,
    Ddah,
    MinimalApplication,
    Application,
    PostingPosition,
    MinimalPostingPosition,
    MinimalPosting,
    Posting,
    ApplicantMatchingDatum,
    MinimalApplicantMatchingDatum,
} from "../../api/defs/types";
import { getCustomQuestionNamesAsArrayStr } from "../../components/custom-question-utils";

/**
 * Determine whether `wageChunks` can be derived from `session`. E.g.,
 * the rates match the session rates.
 *
 * @param {*} wageChunks
 * @param {*} position
 * @param {*} session
 * @param {number} assignmentHours
 * @returns {boolean}
 */
function wageChunksMatchPositionAndSession(
    wageChunks: WageChunk[],
    position: Position,
    session: Session,
    assignmentHours: number
): boolean {
    if (!session || !Array.isArray(wageChunks)) {
        return true;
    }
    // A single wage chunk matching the session rate is derivable
    if (wageChunks.length === 1) {
        const chunk: WageChunk = wageChunks[0];
        if (
            chunk.start_date === position.start_date &&
            chunk.end_date === position.end_date &&
            (chunk.rate === session.rate1 || chunk.rate === session.rate2) &&
            chunk.hours === assignmentHours
        ) {
            return true;
        }
    }
    // Two wage chunks split at January matching the session rates are derivable
    if (wageChunks.length === 2) {
        let [chunk1, chunk2] = wageChunks;
        // If for some reason the wage chunks don't have dates, they aren't derivable.
        if (
            !chunk1.end_date ||
            !chunk1.end_date ||
            !chunk2.start_date ||
            !chunk2.end_date
        ) {
            return false;
        }
        // Make sure the wage chunks are ordered by date
        if (chunk1.end_date > chunk2.start_date) {
            const tmp = chunk1;
            chunk1 = chunk2;
            chunk2 = tmp;
        }

        // If the wage chunk dates don't match the position's dates,
        // we're not derivable.
        if (
            chunk1.start_date !== position.start_date ||
            chunk2.end_date !== position.end_date
        ) {
            return false;
        }

        // If the sum of hours of wage chunks doesn't match the hours of assignment
        // we're not derivable.
        if (chunk1.hours + chunk2.hours !== assignmentHours) {
            return false;
        }

        // If the wage chunks are split exactly at a year boundary and the rates
        // match the session rates, then we *are* derivable.
        if (
            (chunk1.end_date || "").slice(5, 10) === "12-31" &&
            (chunk2.start_date || "").slice(5, 10) === "01-01" &&
            chunk1.rate === session.rate1 &&
            chunk2.rate === session.rate2
        ) {
            return true;
        }
    }
    return false;
}

/**
 * Prepare a minimal representation of the specified object suitable for
 * export. The returned object will contain exactly the fields needed to
 * perfectly reconstruct the object on import an no others. E.g., instructors
 * referenced by a position will only be referenced by UTORid (and won't have information
 * about their names, etc.).
 *
 * These function also strips all `id` fields, since these are database specific and
 * not used when importing.
 */
export const prepareMinimal = {
    session: function (session: Session): MinimalSession {
        return {
            name: session.name,
            start_date: session.start_date,
            end_date: session.end_date,
            rate1: session.rate1,
            rate2: session.rate2,
        };
    },
    contractTemplate: function (
        contractTemplate: ContractTemplate
    ): MinimalContractTemplate {
        return {
            template_name: contractTemplate.template_name,
            template_file: contractTemplate.template_file,
        };
    },
    letterTemplate: function (
        letterTemplate: LetterTemplate
    ): MinimalLetterTemplate {
        return {
            template_name: letterTemplate.template_name,
            template_file: letterTemplate.template_file,
        };
    },
    instructor: function (instructor: Instructor): MinimalInstructor {
        return {
            first_name: instructor.first_name,
            last_name: instructor.last_name,
            utorid: instructor.utorid,
            email: instructor.email,
        };
    },
    position: function (position: Position): MinimalPosition {
        const customQuestionsString = getCustomQuestionNamesAsArrayStr(position.custom_questions);
        let customQuestions;
        try {
            customQuestions = customQuestionsString ? JSON.parse(customQuestionsString) : [];
        } catch {
            customQuestions = [];
        }
        return {
            position_code: position.position_code,
            position_title: position.position_title,
            hours_per_assignment: position.hours_per_assignment,
            start_date: position.start_date,
            end_date: position.end_date,
            duties: position.duties,
            qualifications: position.qualifications,
            custom_questions: customQuestions,
            desired_num_assignments: position.desired_num_assignments,
            current_enrollment: position.current_enrollment,
            current_waitlisted: position.current_waitlisted,
            instructors: position.instructors.map(
                (instructor) => instructor.utorid
            ),
            contract_template: position.contract_template.template_name,
            session_id: position.session_id,
        };
    },
    posting: function (posting: Posting): MinimalPosting {
        const customQuestionsString = getCustomQuestionNamesAsArrayStr(posting.custom_questions);
        let customQuestions;
        try {
            customQuestions = customQuestionsString ? JSON.parse(customQuestionsString) : [];
        } catch {
            customQuestions = [];
        }
        return {
            name: posting.name,
            open_date: posting.open_date,
            close_date: posting.close_date,
            intro_text: posting.intro_text,
            custom_questions: customQuestions,
            posting_positions: posting.posting_positions.map(
                prepareMinimal.postingPosition
            ),
        };
    },
    postingPosition: function (
        postingPosition: PostingPosition
    ): MinimalPostingPosition {
        return {
            position_code: postingPosition.position.position_code,
            num_positions: postingPosition.num_positions,
            hours: postingPosition.hours,
        };
    },
    wageChunk: function (wageChunk: WageChunk): MinimalWageChunk {
        return {
            start_date: wageChunk.start_date,
            end_date: wageChunk.end_date,
            rate: wageChunk.rate,
            hours: wageChunk.hours,
        };
    },
    assignment: function (
        assignment: Assignment,
        session: Session
    ): MinimalAssignment {
        const ret: MinimalAssignment = {
            utorid: assignment.applicant.utorid,
            position_code: assignment.position.position_code,
        } as MinimalAssignment;
        // If there is an contract_override_pdf, we store it, otherwise
        // the contract comes from the `position` so we don't need to store it.
        if (assignment.contract_override_pdf) {
            ret.contract_override_pdf = assignment.contract_override_pdf;
        }

        // If the start and end dates match the position, there is no need to
        // store them.
        const position = assignment.position;
        if (
            (assignment.start_date &&
                assignment.start_date !== position.start_date) ||
            (assignment.end_date && assignment.end_date !== position.end_date)
        ) {
            ret.start_date = assignment.start_date || position.start_date;
            ret.end_date = assignment.end_date || position.end_date;
        }
        // If there is a single wage chunk and the rate matches the session rate,
        // then just store the number of hours. Otherwise, store the wage chunk(s)
        if (
            !Array.isArray(assignment.wage_chunks) ||
            assignment.wage_chunks.length === 0
        ) {
            ret.hours = assignment.hours;
        } else if (
            session &&
            wageChunksMatchPositionAndSession(
                assignment.wage_chunks,
                position,
                session,
                assignment.hours
            )
        ) {
            // The rate is the same as the session rate, so we don't need to store the
            // wage chunk details
            ret.hours = assignment.hours;
        } else {
            ret.wage_chunks = assignment.wage_chunks.map((chunk) =>
                prepareMinimal.wageChunk(chunk)
            );
        }

        return ret;
    },
    applicant: function (applicant: Applicant): MinimalApplicant {
        return {
            first_name: applicant.first_name,
            last_name: applicant.last_name,
            utorid: applicant.utorid,
            email: applicant.email,
            student_number: applicant.student_number,
            phone: applicant.phone,
        };
    },
    application: function (
        application: Application,
        activePositionId?: number
    ): MinimalApplication | Record<string, any> {
        if (activePositionId) {
            // Instructor-side export: only include info for this position
            const posPref = application.position_preferences.find(
                (pp) => pp.position.id === activePositionId
            );
            const instrPref = application.instructor_preferences.find(
                (ip) => ip.position.id === activePositionId
            );
            return Object.assign(prepareMinimal.applicant(application.applicant), {
                annotation: application.annotation,
                comments: application.comments,
                department: application.department,
                gpa: application.gpa,
                program: application.program,
                yip: application.yip,
                documents: application.documents,
                custom_question_answers: application.custom_question_answers,
                posting: application.posting?.name || null,
                applicant_preference_level: posPref?.preference_level ?? null,
                position_custom_question_answers: posPref?.custom_question_answers ?? null,
                instructor_preference_level: instrPref?.preference_level ?? null,
                instructor_comment: instrPref?.comment ?? null,
                submission_date: application.submission_date,
            });
        } else {
            // Admin-side export: show all applications for the session
            return Object.assign(prepareMinimal.applicant(application.applicant), {
                annotation: application.annotation,
                comments: application.comments,
                department: application.department,
                gpa: application.gpa,
                program: application.program,
                yip: application.yip,
                documents: application.documents,
                custom_question_answers: application.custom_question_answers,
                posting: application.posting?.name || null,
                position_preferences: application.position_preferences.filter(
                    (position_preference) => position_preference.preference_level !== -1
                ).map(
                    (position_preference) => ({
                        position_code: position_preference.position.position_code,
                        preference_level: position_preference.preference_level,
                        custom_question_answers: position_preference.custom_question_answers,
                    })
                ),
                instructor_preferences: application.instructor_preferences.map(
                    (pref) => ({
                        position_code: pref.position.position_code,
                        preference_level: pref.preference_level,
                        comment: pref.comment,
                    })
                ),
                submission_date: application.submission_date,
            });
        }
    },
    ddah: function (ddah: Ddah): MinimalDdah {
        const duties = [...ddah.duties];
        duties.sort((a, b) => a.order - b.order);

        return {
            position_code: ddah.assignment.position.position_code,
            applicant: ddah.assignment.applicant.utorid,
            duties: duties.map((duty) => ({
                hours: duty.hours,
                description: duty.description,
            })),
        };
    },
    applicantMatchingDatum: function (
        applicantMatchingDatum: ApplicantMatchingDatum
    ): MinimalApplicantMatchingDatum {
        return {
            utorid: applicantMatchingDatum.applicant.utorid,
            min_hours_owed: applicantMatchingDatum.min_hours_owed,
            max_hours_owed: applicantMatchingDatum.max_hours_owed,
            prev_hours_fulfilled: applicantMatchingDatum.prev_hours_fulfilled,
            letter_template: applicantMatchingDatum.letter_template.template_name,
        } as MinimalApplicantMatchingDatum;
    },
};
