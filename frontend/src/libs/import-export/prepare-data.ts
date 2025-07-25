import { dataToFile } from "./data-to-file";
import { prepareSpreadsheet } from "./prepare-spreadsheet";
import { prepareMinimal } from "./prepare-minimal";
import type {
    Applicant,
    ApplicantMatchingDatum,
    Application,
    Assignment,
    Ddah,
    Instructor,
    Position,
    Posting,
    Session,
} from "../../api/defs/types";
import type { ExportFormat } from "./data-to-file";

export type PrepareDataFunc<T> = (data: T[], dataFormat: ExportFormat) => File;
type FilterFunc<T> = ((array: T[]) => T[]) | null;

/**
 * Make a function that converts a list of applications into a `File` object.
 * If `activePosition` is null then this will perform a general admin-side
 * export of all applications, otherwise it will perform an instructor-side
 * export of applications for the given position.
 *
 * @export
 * @param {Applicant[]} applications
 * @param {"csv" | "json" | "xlsx"} dataFormat
 * @param {Position | null} activePosition
 * @returns
 */
export function prepareApplicationData(
    applications: Application[],
    dataFormat: ExportFormat,
    activePosition: Position | null = null,
) {
    return dataToFile(
        {
            toSpreadsheet: () =>
                prepareSpreadsheet.application(applications, activePosition),
            toJson: () => ({
                applications: applications.map((application) =>
                    prepareMinimal.application(
                        application,
                        activePosition?.id
                    )
                ),
            }),
        },
        dataFormat,
        `${activePosition ? activePosition.position_code + "_" : ""}applications`
    );
}

/**
 * Make a function that converts a posting into a `File` object.
 *
 * @export
 * @param {Posting} posting
 * @param {"csv" | "json" | "xlsx"} dataFormat
 * @returns
 */
export function preparePostingData(posting: Posting, dataFormat: ExportFormat) {
    return dataToFile(
        {
            toSpreadsheet: () => prepareSpreadsheet.posting(posting),
            toJson: () => ({
                postings: [prepareMinimal.posting(posting)],
            }),
        },
        dataFormat,
        "postings"
    );
}

/**
 * Make a function that converts a list of applicants into a `File` object.
 *
 * @export
 * @param {Applicant[]} applicants
 * @param {"csv" | "json" | "xlsx"} dataFormat
 * @returns
 */
export function prepareApplicantData(
    applicants: Applicant[],
    dataFormat: ExportFormat
) {
    return dataToFile(
        {
            toSpreadsheet: () => prepareSpreadsheet.applicant(applicants),
            toJson: () => ({
                applicants: applicants.map((applicant) =>
                    prepareMinimal.applicant(applicant)
                ),
            }),
        },
        dataFormat,
        "applicants"
    );
}

/**
 * A factory function which produces assignment prepareData function,
 *
 * @export
 * @param session
 * @param assignmentFilter
 * @returns
 */
export function prepareAssignmentDataFactory(
    session: Session,
    assignmentFilter: FilterFunc<Assignment> = null
) {
    // Make a function that converts a list of assignments into a `File` object.
    return function prepareData(
        assignments: Assignment[],
        dataFormat: ExportFormat
    ) {
        if (assignmentFilter instanceof Function) {
            assignments = assignmentFilter(assignments);
        }
        return dataToFile(
            {
                toSpreadsheet: () => prepareSpreadsheet.assignment(assignments),
                toJson: () => ({
                    assignments: assignments.map((assignment) =>
                        prepareMinimal.assignment(assignment, session)
                    ),
                }),
            },
            dataFormat,
            "assignments"
        );
    };
}

/**
 * A factory function which produces ddah prepareData function,
 *
 * @export
 * @param ddahFilter
 * @returns
 */
export function prepareDdahDataFactory(ddahFilter: FilterFunc<Ddah>) {
    // Make a function that converts a list of ddahs into a `File` object.
    return function prepareData(ddahs: Ddah[], dataFormat: ExportFormat) {
        if (ddahFilter instanceof Function) {
            ddahs = ddahFilter(ddahs);
        }
        return dataToFile(
            {
                toSpreadsheet: () => prepareSpreadsheet.ddah(ddahs),
                toJson: () => ({
                    ddahs: ddahs.map((ddah) => prepareMinimal.ddah(ddah)),
                }),
            },
            dataFormat,
            "ddahs"
        );
    };
}

/**
 * Make a function that converts a list of instructors into a `File` object.
 *
 * @export
 * @param {Instructor[]} instructors
 * @param {"csv" | "json" | "xlsx"} dataFormat
 * @returns
 */
export function prepareInstructorData(
    instructors: Instructor[],
    dataFormat: ExportFormat
) {
    return dataToFile(
        {
            toSpreadsheet: () => prepareSpreadsheet.instructor(instructors),
            toJson: () => ({
                instructors: instructors.map((instructor) =>
                    prepareMinimal.instructor(instructor)
                ),
            }),
        },
        dataFormat,
        "instructors"
    );
}

/**
 * Make a function that converts a list of positions into a `File` object.
 *
 * @export
 * @param {Position[]} positions
 * @param {"csv" | "json" | "xlsx"} dataFormat
 * @returns
 */
export function preparePositionData(
    positions: Position[],
    dataFormat: ExportFormat
) {
    return dataToFile(
        {
            toSpreadsheet: () => prepareSpreadsheet.position(positions),
            toJson: () => ({
                positions: positions.map((position) =>
                    prepareMinimal.position(position)
                ),
            }),
        },
        dataFormat,
        "positions"
    );
}

/**
 * Make a function that converts a list of applicant matching datum into a
 * `File` object.
 *
 * @export
 * @param {ApplicantMatchingDatum[]} applicantMatchingData
 * @param {"csv" | "json" | "xlsx"} dataFormat
 * @returns
 */
export function prepareApplicantMatchingData(
    applicantMatchingData: ApplicantMatchingDatum[],
    dataFormat: ExportFormat
) {
    return dataToFile(
        {
            toSpreadsheet: () =>
                prepareSpreadsheet.appointment(
                    applicantMatchingData.filter(
                        (x) =>
                            x.min_hours_owed !== null ||
                            x.max_hours_owed !== null ||
                            x.prev_hours_fulfilled !== null
                    )
                ),
            toJson: () => ({
                applicantMatchingData: applicantMatchingData
                    .filter(
                        (x) =>
                            x.min_hours_owed !== null ||
                            x.max_hours_owed !== null ||
                            x.prev_hours_fulfilled !== null
                    )
                    .map((applicantMatchingDatum) =>
                        prepareMinimal.applicantMatchingDatum(
                            applicantMatchingDatum
                        )
                    ),
            }),
        },
        dataFormat,
        "appointment_guarantees"
    );
}
