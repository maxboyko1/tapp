import React from "react";
import FileSaver from "file-saver";
import { activeSessionSelector, applicationsSelector, exportAssignments } from "../../../api/actions";
import { ExportActionButton } from "../../../components/export-button";
import { dataToFile, CellType, ExportFormat } from "../../../libs/import-export";
import { useThunkDispatch } from "../../../libs/thunk-dispatch";
import { useSelector } from "react-redux";
import { activePositionSelector } from "../store/actions";
import { Applicant, Application, Assignment, Position } from "../../../api/defs/types";
import { normalizeSpreadsheet } from "../../../libs/import-export/normalize-spreadsheet";

/**
 * Slice a date string to only include the YYYY-MM-DD part.
 */
function truncDate(date: string): string {
    return date.slice(0, 10);
}

/**
 * Create a JSON export containing assignment information and applicant information
 * for assignments corresponding to `position`
 *
 * @param {Position} position
 * @returns
 */
function jsonOutputForPosition(position: Position) {
    return function makeJsonOutput(assignments: Assignment[]) {
        assignments = assignments.filter(
            (assignment) => assignment.position.id === position.id
        );
        const applicantsHash: Record<string, Applicant> = {};
        for (const assignment of assignments) {
            applicantsHash[assignment.applicant.utorid] = assignment.applicant;
        }
        const data = {
            assignments: assignments.map((assignment) => ({
                utorid: assignment.applicant.utorid,
                position_code: assignment.position.position_code,
                hours: assignment.hours,
                start_date: truncDate(assignment.start_date),
                end_date: truncDate(assignment.end_date),
                status: assignment.active_offer_status,
                wage_chunks: assignment.wage_chunks?.map((wageChunk) => ({
                    hours: wageChunk.hours,
                    start_date: truncDate(wageChunk.start_date),
                    end_date: truncDate(wageChunk.end_date),
                    rate: wageChunk.rate,
                })),
            })),
            applicants: Object.values(applicantsHash).map((applicant) => ({
                utorid: applicant.utorid,
                student_number: applicant.student_number,
                first_name: applicant.first_name,
                last_name: applicant.last_name,
                email: applicant.email,
            })),
            positions: [
                {
                    position_code: position.position_code,
                    position_title: position.position_title,
                    start_date: truncDate(position.start_date),
                    end_date: truncDate(position.end_date),
                    current_enrollment: position.current_enrollment,
                    current_waitlisted: position.current_waitlisted,
                    duties: position.duties,
                    qualifications: position.qualifications,
                    instructors: position.instructors.map((instructor) => ({
                        first_name: instructor.first_name,
                        last_name: instructor.last_name,
                        email: instructor.email,
                    })),
                },
            ],
        };

        const file = new File(
            [JSON.stringify(data, null, 4)],
            `${position.position_code}.json`,
            {
                type: "application/json",
            }
        );
        return file;
    };
}

/**
 * Create a spreadsheet export containing assignment, applicant and application
 * information for assignments corresponding to `position`
 * 
 * @param {Position} position 
 * @param {Application[]} applications
 * @returns
 */
function spreadsheetOutputForInstructorAssignments(position: Position, applications: Application[]) {
    return function prepareSpreadsheetData(assignments: Assignment[], dataFormat: ExportFormat) {
        return dataToFile({
            toJson: () => {}, // placeholder
            toSpreadsheet: () => {
                assignments = assignments.filter(
                    (assignment) => assignment.position.id === position.id
                );

                // Find the original application to associate with each assignment here, which is the most
                // recently submitted application by this applicant to include this position in its position
                // preferences, and which we will need for computing most of the spreadsheet data
                const assignmentsWithApplication = assignments.map((assignment) => ({
                    first_name: assignment.applicant.first_name,
                    last_name: assignment.applicant.last_name,
                    utorid: assignment.applicant.utorid,
                    student_number: assignment.applicant.student_number,
                    email: assignment.applicant.email,
                    application: (() => {
                        const validApplications = applications.filter((application) => 
                            application.applicant.id === assignment.applicant.id &&
                            application.position_preferences.some((pref) => pref.position.id === position.id)
                        );
                        validApplications.sort((a, b) =>
                            a.submission_date === b.submission_date ? 0 :
                            a.submission_date > b.submission_date ? 1 : -1
                        )
                        return validApplications.at(-1);
                    })(),
                }));

                // Parse each application's custom_question_answers field into a JS object, and keep track
                // of every question field we see across all the applications here, all of which will become
                // columns in the eventual spreadsheet
                const customQuestionFieldsSet: Set<string> = new Set();
                const assignmentsWithAnswersObj = assignmentsWithApplication.map((assignment) => {
                    const answers = assignment.application?.custom_question_answers as
                        { [key: string]: any } | undefined;
                    const formattedAnswers: { [key: string]: CellType } = {};
                    let priorAssignments: string[] = [];

                    if (answers && typeof answers === 'object' && !Array.isArray(answers)) {
                        Object.keys(answers).forEach((field) => {
                            if (field === "prior_assignments") {
                                // Save prior_assignments separately and do not add to customQuestionFieldsSet
                                priorAssignments = Array.isArray(answers[field]) ? answers[field] : [];
                                return;
                            }
                            if (field !== "utorid") {
                                customQuestionFieldsSet.add(field);
                            }
                            const value = (answers as { [key: string]: any })[field];
                            if (Array.isArray(value) || typeof value == 'boolean') {
                                formattedAnswers[field] = value.toString();
                            } else {
                                formattedAnswers[field] = value;
                            }
                        });
                    }

                    return {
                        ...assignment,
                        answers: formattedAnswers,
                        priorAssignments,
                    };
                });
                
                // Sort overall list of custom question field names alphabetically, i.e. the order in
                // which they will appear in the spreadsheet
                const customQuestionFields = Array.from(customQuestionFieldsSet);
                customQuestionFields.sort();

                // Compute and flatten remaining fields from application and custom question answers
                const assignmentsForSpreadsheet = assignmentsWithAnswersObj.map((assignment) => ({
                    ...assignment,
                    department: assignment.application?.department,
                    program: assignment.application?.program,
                    preference_level:
                        assignment.application?.position_preferences
                                               .find((pref) => pref.position.id === position.id)
                                              ?.preference_level,
                    past_ta_for_course: (() => {
                        const matches = position.position_code.match(/\b[a-zA-Z]{3}\d{3,4}/);
                        const posCodeAbbr = matches ? matches[0] : null;
                        return (posCodeAbbr &&
                            assignment.priorAssignments &&
                            assignment.priorAssignments.some((s) => s.includes(posCodeAbbr)))
                            ? "Yes"
                            : "";
                    })(),
                    ...customQuestionFields.reduce((acc: { [key: string]: CellType }, field) => {
                        acc[field] = assignment.answers[field];
                        return acc;
                    }, {}),
                }));

                return normalizeSpreadsheet(
                    (
                        [
                            [
                                "Last Name",
                                "First Name",
                                "UTORid",
                                "Student Number",
                                "Email",
                                "Department",
                                "Program",
                                "Preference Level",
                                "Past TA For Course?",
                                ...customQuestionFields,
                            ],
                        ] as CellType[][]
                    ).concat(
                        assignmentsForSpreadsheet.map((assignment) => [
                            assignment.last_name,
                            assignment.first_name,
                            assignment.utorid,
                            assignment.student_number,
                            assignment.email,
                            assignment.department,
                            assignment.program,
                            assignment.preference_level,
                            assignment.past_ta_for_course,
                            ...customQuestionFields.map((field) =>
                                (assignment as unknown as { [key: string]: CellType })[field]
                            ),
                        ])
                    )
                );
            },
        }, dataFormat, `${position.position_code}_assignments`);
    };
}

/**
 * Allows for the download of a file blob containing the exported instructors.
 * Instructors are synchronized from the server before being downloaded.
 *
 * @export
 * @returns
 */
export function ConnectedExportAssignmentsAction() {
    const dispatch = useThunkDispatch();
    const [exportType, setExportType] = React.useState<ExportFormat | null>(
        null
    );
    const session = useSelector(activeSessionSelector);
    const activePosition = useSelector(activePositionSelector);
    const applications = useSelector(applicationsSelector);

    React.useEffect(() => {
        if (!exportType) {
            return;
        }

        async function doExport() {
            // Having an export type of `null` means we're ready to export again,
            // We set the export type to null at the start so in case an error occurs,
            // we can still try again. This *will not* affect the current value of `exportType`
            setExportType(null);
            if (exportType == null) {
                throw new Error(`Unknown export type ${exportType}`);
            }
            if (!session) {
                throw new Error("Must have a session selected to export data");
            }
            if (!activePosition) {
                throw new Error("Must have a position selected to export data");
            }

            if (exportType === "json") {
                const file = await dispatch(
                    exportAssignments(
                        jsonOutputForPosition(activePosition),
                        exportType
                    )
                );

                FileSaver.saveAs(file as any);
            } else {
                if (!applications) {
                    throw new Error("Cannot access applications data needed for spreadsheet export");
                }

                const file = await dispatch(
                    exportAssignments(
                        spreadsheetOutputForInstructorAssignments(activePosition, applications),
                        exportType
                    )
                );

                FileSaver.saveAs(file as any);
            }
        }
        doExport().catch(console.error);
    }, [exportType, dispatch, activePosition, session, applications]);

    function onClick(option: ExportFormat) {
        setExportType(option);
    }

    return <ExportActionButton onClick={onClick} />;
}
