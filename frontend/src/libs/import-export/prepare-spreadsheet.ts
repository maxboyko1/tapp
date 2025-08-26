import {
    Applicant,
    ApplicantMatchingDatum,
    Application,
    Assignment,
    Ddah,
    Instructor,
    Position,
    Posting,
    WageChunk,
} from "../../api/defs/types";
import { isQuestionsFieldInValidFormat } from "../../components/custom-question-utils";
import { normalizeSpreadsheet } from "./normalize-spreadsheet";
import { prepareMinimal } from "./prepare-minimal";

/**
 * Type of a spreadsheet cell
 */
export type CellType = number | string | null | undefined;

/**
 * Return an array of [hours, duty, hours duty, ...] for the specified `ddah`
 *
 * @param ddah
 * @returns
 */
function flattenDuties(ddah: Ddah) {
    const ret = [];
    const duties = [...ddah.duties];
    duties.sort((a, b) => a.order - b.order);

    for (const duty of duties) {
        ret.push(duty.hours);
        ret.push(duty.description);
    }

    return ret;
}

/**
 * Format a date as YYYY-MM-DD for inserting into a spreadsheet
 *
 * @param {*} date
 * @returns
 */
function formatDateForSpreadsheet(date: string | number | null | undefined) {
    try {
        return date && new Date(date).toJSON().slice(0, 10);
    } catch {
        return "";
    }
}

type BasicWageChunk = ({ hours: number } & Record<string, any>)[];
interface HasWageChunk extends Record<string, any> {
    wage_chunks: BasicWageChunk | undefined;
}

/**
 * Create header columns for a spreadsheet containing information about every pay period.
 *
 * @param {*} assignments
 * @returns
 */
function createPayPeriodHeaders(assignments: HasWageChunk[]) {
    const ret: string[] = [];
    if (!assignments) {
        return ret;
    }
    const maxNumPeriods = Math.max(
        ...assignments.map((assignment) => assignment.wage_chunks?.length || 0),
        0
    );

    for (let i = 0; i < maxNumPeriods; i++) {
        ret.push(
            `Period ${i + 1} Rate`,
            `Period ${i + 1} Hours`,
            `Period ${i + 1} Start Date`,
            `Period ${i + 1} End Date`
        );
    }
    return ret;
}

/**
 * Create formatted rows providing information about each wage chunk.
 *
 * @param {*} wageChunks
 * @returns
 */
function formatWageChunksToList(
    wageChunks: Omit<WageChunk, "id">[] | null | undefined
) {
    const ret: (string | number | undefined | null)[] = [];
    if (!wageChunks) {
        return ret;
    }

    ret.push(wageChunks.length);
    for (const chunk of wageChunks) {
        ret.push(
            chunk.rate,
            chunk.hours,
            formatDateForSpreadsheet(chunk.start_date),
            formatDateForSpreadsheet(chunk.end_date)
        );
    }
    return ret;
}

/**
 * Functions which turns an array of objects into an Array of Arrays suitable
 * for converting into a spreadsheet.
 */
export const prepareSpreadsheet = {
    instructor: function (instructors: Instructor[]) {
        return normalizeSpreadsheet(
            (
                [["Last Name", "First Name", "UTORid", "email"]] as CellType[][]
            ).concat(
                instructors.map((instructor) => [
                    instructor.last_name,
                    instructor.first_name,
                    instructor.utorid,
                    instructor.email,
                ])
            )
        );
    },
    applicant: function (applicants: Applicant[]) {
        return normalizeSpreadsheet(
            (
                [
                    [
                        "Last Name",
                        "First Name",
                        "UTORid",
                        "Student Number",
                        "email",
                        "Phone",
                    ],
                ] as CellType[][]
            ).concat(
                applicants.map((applicant) => [
                    applicant.last_name,
                    applicant.first_name,
                    applicant.utorid,
                    applicant.student_number,
                    applicant.email,
                    applicant.phone,
                ])
            )
        );
    },
    application: function (
        applications: Application[],
        allAssignments: Assignment[],
        activePosition: Position | null = null,
    ) {
        const minApps = applications.map(app =>
            prepareMinimal.application(app, activePosition?.id)
        );
        const baseUrl = document.location.origin;

        // Collect all unique posting-level custom question keys (excluding "utorid"),
        // rendering each of them as a column in the spreadsheet.
        const allCustomQuestionKeys = Array.from(
            new Set(
                minApps.flatMap(app =>
                    app.custom_question_answers
                        ? Object.keys(app.custom_question_answers).filter((k) => k !== "utorid")
                        : []
                )
            )
        );

        // A null activePosition value means we are performing the admin-side spreadsheet export
        // of all applications for the session, a non-null activePosition means we are performing
        // the instructor-side export of applications for one specific position, in which case we
        // are streamlining the info shown for some columns, and omitting some of them entirely
        const headers = [
            "Last Name",
            "First Name",
            "UTORid",
            "Student Number",
            "email",
            ...(activePosition ? [] : ["Phone"]),
            "Annotation",
            "Department",
            "Program",
            "YIP",
            ...(activePosition ? [] : ["GPA"]),
            ...(activePosition ? [] : ["Posting"]),
            "Applicant Comments",
            ...(activePosition
                ? [
                    "Applicant Preference Level",
                    "Instructor Preference Level",
                    "Instructor Comment"
                ]
                : [
                    "Position Preferences",
                    "Top 10 Positions",
                    "Instructor Preferences",
                    "Instructor Comments"
                ]),
            "Assignment(s)",
            "Documents",
            ...(activePosition ? [] : ["Submission Date"]),
            ...allCustomQuestionKeys,
        ];

        return normalizeSpreadsheet(
            [
                headers,
                ...minApps.map((application: any) => {
                    // Compute assignments for this applicant
                    const utorid = application.applicant?.utorid || application.utorid;
                    const applicantAssignments = allAssignments
                        .filter(
                            (assignment: Assignment) =>
                                assignment.active_offer_status &&
                                assignment.applicant &&
                                utorid &&
                                assignment.applicant.utorid === utorid
                        )
                        .map(
                            (assignment: Assignment) =>
                                `${assignment.position.position_code} (${assignment.hours}) (${assignment.active_offer_status})`
                        );

                    return [
                        application.last_name,
                        application.first_name,
                        application.utorid,
                        application.student_number,
                        application.email,
                        ...(activePosition ? [] : [application.phone]),
                        application.annotation,
                        application.department,
                        application.program,
                        application.yip,
                        ...(activePosition ? [] : [application.gpa]),
                        ...(activePosition ? [] : [application.posting]),
                        application.comments,
                        ...(activePosition
                            ? [
                                application.applicant_preference_level,
                                application.instructor_preference_level,
                                application.instructor_comment
                            ]
                            : [
                                application.position_preferences
                                    .filter((pref: any) => pref.preference_level !== -1)
                                    .map((pref: any) => `${pref.position_code}:${pref.preference_level}`)
                                    .join("; "),
                                application.position_preferences
                                    .filter(
                                        (pref: any) =>
                                            pref.preference_level >= 1 && pref.preference_level <= 4
                                    )
                                    .sort(
                                        (a: any, b: any) => b.preference_level - a.preference_level
                                    )
                                    .map((pref: any) => pref.position_code)
                                    .join(", "),
                                application.instructor_preferences
                                    .map(
                                        (pref: any) =>
                                            `${pref.position_code}:${pref.preference_level}`
                                    )
                                    .join("; "),
                                application.instructor_preferences
                                    .filter((pref: any) => pref.comment != null)
                                    .map(
                                        (pref: any) => `${pref.position_code}:"${pref.comment}"`
                                    )
                                    .join("; "),
                            ]),
                        applicantAssignments.join("; "),
                        application.documents
                            .map(
                                (document: any) =>
                                    new URL(
                                        `${baseUrl}/external/files/${document.url_token}`
                                    ).href
                            )
                            .join(" "),
                        ...(activePosition ? [] : [application.submission_date]),
                        ...allCustomQuestionKeys.map((key) => {
                            const value = (application.custom_question_answers as Record<string, any> | undefined)?.[key];
                            if (Array.isArray(value)) {
                                return value.join("; ");
                            }
                            return value ?? "";
                        }),
                    ];
                }),
            ]
        );
    },
    position: function (positions: Position[]) {
        // Find the maximum number of questions in any position
        const maxQuestions = Math.max(
            ...positions.map((position) =>
                isQuestionsFieldInValidFormat(position.custom_questions)
                    ? (position.custom_questions?.elements.length ?? 0)
                    : 1 // If invalid, we will show just one column for the error message
            )
        );

        // Build the header row
        const baseHeaders = [
            "Position Code",
            "Position Title",
            "Start Date",
            "End Date",
            "Hours Per Assignment",
            "Number of Assignments",
            "Contract Template",
            "Instructors",
            "Duties",
            "Qualifications",
            "Current Enrollment",
            "Current Waitlist",
        ];
        const questionHeaders = Array.from({ length: maxQuestions }, () => "question");
        const headers = [...baseHeaders, ...questionHeaders];

        // Build the data rows
        const rows = positions.map((position) => {
            const baseRow = [
                position.position_code,
                position.position_title,
                position.start_date && new Date(position.start_date).toJSON().slice(0, 10),
                position.end_date && new Date(position.end_date).toJSON().slice(0, 10),
                position.hours_per_assignment,
                position.desired_num_assignments,
                position.contract_template.template_name,
                position.instructors
                    .map(
                        (instructor) =>
                            `${instructor.last_name}, ${instructor.first_name}`
                    )
                    .join("; "),
                position.duties || "",
                position.qualifications || "",
                position.current_enrollment,
                position.current_waitlisted,
            ];

            let questionCells: string[] = [];
            if (!isQuestionsFieldInValidFormat(position.custom_questions)) {
                // Invalid format: put error message in first question column, rest blank
                questionCells = ["Unsupported questions format", ...Array(maxQuestions - 1).fill("")];
            } else {
                // Valid format: fill with question names, pad with blanks if needed
                const questions = position.custom_questions?.elements.map(q => q.name) ?? [];
                questionCells = [
                    ...questions,
                    ...Array(maxQuestions - questions.length).fill("")
                ];
            }

            return [...baseRow, ...questionCells];
        });

        return normalizeSpreadsheet([
            headers,
            ...rows
        ]);
    },
    posting: function (posting: Posting) {
        // Most of the information about the posting is exported in the first row of the spreadsheet.
        // However, the PostingPositions take many rows. In the additional rows we fill cells with
        // `null` so that they show up empty in the spreadsheet.
        let questionHeaders: string[] = [];
        let questionValues: string[] = [];
        if (isQuestionsFieldInValidFormat(posting.custom_questions)) {
            const questions = posting.custom_questions?.elements.map(q => q.name) ?? [];
            questionHeaders = Array.from({ length: questions.length }, () => "question");
            questionValues = questions;
        } else {
            // Invalid format: put error message in first question column, rest blank
            questionHeaders = ["custom_questions"];
            questionValues = ["Unsupported questions format"];
        }

        const firstItems = [
            posting.name,
            posting.open_date,
            posting.close_date,
        ];
        const emptyFirstItems = [null, null, null];

        // Standard headers
        const baseHeaders = [
            "Name",
            "Open Date",
            "Close Date",
            "Position Code",
            "Num Positions",
            "Hours per Assignment",
            "Intro Text",
        ];
        const lastItems = [
            posting.intro_text,
        ];
        const emptyLastItems = [null];

        // Compose the header row
        const headers = [
            ...baseHeaders,
            ...questionHeaders,
        ];

        return normalizeSpreadsheet(
            [
                headers,
                ...Array.from(
                    { length: Math.max(posting.posting_positions.length, 1) },
                    (_, i) => {
                        const first = i === 0 ? firstItems : emptyFirstItems;
                        const last = i === 0 ? lastItems : emptyLastItems;
                        const questions = i === 0 ? questionValues : questionHeaders.map(() => null);
                        const postingPosition = posting.posting_positions[i];

                        return [
                            ...first,
                            postingPosition?.position?.position_code,
                            postingPosition?.num_positions,
                            postingPosition?.hours,
                            ...last,
                            ...questions,
                        ];
                    }
                )
            ]
        );
    },
    ddah: function prepareDdahsSpreadsheet(ddahs: Ddah[]) {
        // Compute the maximum number of duties, because each duty gets a column.
        const maxDuties = Math.max(
            ...ddahs.map((ddah) => ddah.duties.length || 0),
            0
        );
        // Create headers for the duty columns
        const dutyHeaders = Array.from({ length: maxDuties * 2 }, (_, i) => {
            if (i % 2 === 0) {
                return `Hours ${i / 2 + 1}`;
            }
            return `Duty ${(i - 1) / 2 + 1}`;
        });

        return normalizeSpreadsheet(
            (
                [
                    [
                        "Position",
                        "Last Name",
                        "First Name",
                        "email",
                        "Assignment Hours",
                        "Offer Status",
                        "",
                    ].concat(dutyHeaders),
                ] as CellType[][]
            ).concat(
                ddahs.map((ddah) =>
                    [
                        ddah.assignment.position.position_code,
                        ddah.assignment.applicant.last_name,
                        ddah.assignment.applicant.first_name,
                        ddah.assignment.applicant.email,
                        ddah.assignment.hours,
                        ddah.assignment.active_offer_status,
                        "",
                    ].concat(flattenDuties(ddah))
                )
            )
        );
    },
    assignment: function (assignments: Assignment[]) {
        // We want to flatten a lot of the data in `assignments` and only include the information
        // we need.
        const assignmentsForSpreadsheet = assignments.map((assignment) => ({
            first_name: assignment.applicant.first_name,
            last_name: assignment.applicant.last_name,
            utorid: assignment.applicant.utorid,
            email: assignment.applicant.email,
            position_code: assignment.position.position_code,
            start_date: assignment.start_date,
            end_date: assignment.end_date,
            contract_template: assignment.contract_override_pdf
                ? null
                : assignment.position.contract_template.template_name,
            contract_override_pdf: assignment.contract_override_pdf,
            hours: assignment.hours,
            active_offer_status: assignment.active_offer_status,
            active_offer_recent_activity_date:
                assignment.active_offer_recent_activity_date,
            wage_chunks: assignment.wage_chunks?.map((chunk) => ({
                hours: chunk.hours,
                rate: chunk.rate,
                start_date: chunk.start_date,
                end_date: chunk.end_date,
            })),
        }));
        return normalizeSpreadsheet(
            (
                [
                    [
                        "Last Name",
                        "First Name",
                        "UTORid",
                        "Email",
                        "Position Code",
                        "Start Date",
                        "End Date",
                        "Hours",
                        "Contract Template",
                        "Contract Override PDF",
                        "Offer Status",
                        "Recent Activity Date",
                        "",
                        "Number of Pay Periods",
                        ...createPayPeriodHeaders(assignmentsForSpreadsheet),
                    ],
                ] as CellType[][]
            ).concat(
                assignmentsForSpreadsheet.map((assignment) => [
                    assignment.last_name,
                    assignment.first_name,
                    assignment.utorid,
                    assignment.email,
                    assignment.position_code,
                    formatDateForSpreadsheet(assignment.start_date),
                    formatDateForSpreadsheet(assignment.end_date),
                    assignment.hours,
                    assignment.contract_template,
                    assignment.contract_override_pdf,
                    assignment.active_offer_status,
                    assignment.active_offer_recent_activity_date,
                    null,
                    ...formatWageChunksToList(assignment.wage_chunks),
                ])
            )
        );
    },
    appointment: function (applicantMatchingData: ApplicantMatchingDatum[]) {
        return normalizeSpreadsheet(
            (
                [
                    [
                        "Last Name",
                        "First Name",
                        "UTORid",
                        "Student Number",
                        "Min Hours Owed",
                        "Max Hours Owed",
                        "Previous Hours Fulfilled",
                        "Letter Template",
                        "Appointment Confirmation Status",
                        "Recent Activity Date",
                    ],
                ] as CellType[][]
            ).concat(
                applicantMatchingData.map((applicantMatchingDatum) => [
                    applicantMatchingDatum.applicant.last_name,
                    applicantMatchingDatum.applicant.first_name,
                    applicantMatchingDatum.applicant.utorid,
                    applicantMatchingDatum.applicant.student_number,
                    applicantMatchingDatum.min_hours_owed,
                    applicantMatchingDatum.max_hours_owed,
                    applicantMatchingDatum.prev_hours_fulfilled,
                    applicantMatchingDatum.letter_template.template_name,
                    applicantMatchingDatum.active_confirmation_status,
                    applicantMatchingDatum.active_confirmation_recent_activity_date,
                ])
            )
        );
    },
};
