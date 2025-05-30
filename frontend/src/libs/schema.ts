// a collection of key-mapping between imported JSON keys/ Spreadsheet Column names and
// actual keys of an object

export interface NormalizationSchema<T extends string[]> {
    keys: T;
    keyMap: Record<string, T[number]>;
    requiredKeys: T[number][];
    primaryKey: T[number] | T[number][];
    dateColumns: T[number][];
    baseName: string;
}

export const instructorSchema: NormalizationSchema<
    ["first_name", "last_name", "utorid", "email"]
> = {
    keys: ["first_name", "last_name", "utorid", "email"],
    keyMap: {
        "First Name": "first_name",
        "Given Name": "first_name",
        First: "first_name",
        "Last Name": "last_name",
        Surname: "last_name",
        "Family Name": "last_name",
        Last: "last_name",
    },
    requiredKeys: ["utorid"],
    primaryKey: "utorid",
    dateColumns: [],
    baseName: "instructors",
};

export const applicantSchema: NormalizationSchema<
    ["first_name", "last_name", "utorid", "email", "student_number", "phone"]
> = {
    keys: [
        "first_name",
        "last_name",
        "utorid",
        "email",
        "student_number",
        "phone",
    ],
    keyMap: {
        "First Name": "first_name",
        "Given Name": "first_name",
        First: "first_name",
        "Last Name": "last_name",
        Surname: "last_name",
        "Family Name": "last_name",
        Last: "last_name",
        "Student Number": "student_number",
    },
    requiredKeys: ["utorid"],
    primaryKey: "utorid",
    dateColumns: [],
    baseName: "applicants",
};

export const postingSchema: NormalizationSchema<
    [
        "name",
        "open_date",
        "close_date",
        "intro_text",
        "custom_questions",
        "position_code",
        "num_positions",
        "hours",
        "posting_positions"
    ]
> = {
    keys: [
        "name",
        "open_date",
        "close_date",
        "intro_text",
        "custom_questions",
        "position_code",
        "num_positions",
        "hours",
        "posting_positions",
    ],
    keyMap: {
        Name: "name",
        "Open Date": "open_date",
        "Close Date": "close_date",
        "Intro Text": "intro_text",
        "Custom Questions": "custom_questions",
        "Position Code": "position_code",
        "Num Positions": "num_positions",
        "Hours per Assignment": "hours",
        "Hours per Position": "hours",
    },
    requiredKeys: [],
    primaryKey: "name",
    dateColumns: ["open_date", "close_date"],
    baseName: "postings",
};

export const positionSchema: NormalizationSchema<
    [
        "position_code",
        "position_title",
        "start_date",
        "end_date",
        "hours_per_assignment",
        "desired_num_assignments",
        "contract_template",
        "instructors",
        "duties",
        "qualifications",
        "custom_questions",
        "current_enrollment",
        "current_waitlisted",
        "ad_open_date",
        "ad_close_date",
        "ad_hours_per_assignment",
        "ad_num_assignments"
    ]
> = {
    keys: [
        "position_code",
        "position_title",
        "start_date",
        "end_date",
        "hours_per_assignment",
        "desired_num_assignments",
        "contract_template",
        "instructors",
        "duties",
        "qualifications",
        "custom_questions",
        "current_enrollment",
        "current_waitlisted",
        "ad_open_date",
        "ad_close_date",
        "ad_hours_per_assignment",
        "ad_num_assignments",
    ],
    keyMap: {
        "Position Code": "position_code",
        "Course Code": "position_code",
        "Course Name": "position_code",
        "Position Title": "position_title",
        "Start Date": "start_date",
        Start: "start_date",
        "End Date": "end_date",
        End: "end_date",
        "Hours Per Assignment": "hours_per_assignment",
        "Custom Questions": "custom_questions",
        "Number of Assignments": "desired_num_assignments",
        "Contract Template": "contract_template",
        "Current Enrollment": "current_enrollment",
        "Current Waitlist": "current_waitlisted",
    },
    dateColumns: ["start_date", "end_date"],
    requiredKeys: ["position_code", "contract_template"],
    primaryKey: "position_code",
    baseName: "positions",
};

export const assignmentSchema: NormalizationSchema<
    [
        "utorid",
        "position_code",
        "start_date",
        "end_date",
        "contract_template",
        "contract_override_pdf",
        "hours",
        "wage_chunks"
    ]
> = {
    // We don't list "active_offer_status" because that cannot be imported. It has to be set
    // via the TA or manually by the admin.
    keys: [
        "utorid",
        "position_code",
        "start_date",
        "end_date",
        "contract_template",
        "contract_override_pdf",
        "hours",
        "wage_chunks",
    ],
    keyMap: {
        "Position Code": "position_code",
        "Course Name": "position_code",
        "Start Date": "start_date",
        Start: "start_date",
        "End Date": "end_date",
        End: "end_date",
        Hours: "hours",
        "Contract Override PDF": "contract_override_pdf",
    },
    dateColumns: ["start_date", "end_date"],
    requiredKeys: ["position_code", "utorid"],
    primaryKey: ["utorid", "position_code"],
    baseName: "assignments",
};

export const applicantMatchingDatumSchema: NormalizationSchema<
    ["utorid", "min_hours_owed", "max_hours_owed", "prev_hours_fulfilled", "letter_template"]
> = {
    keys: [
        "utorid",
        "min_hours_owed",
        "max_hours_owed",
        "prev_hours_fulfilled",
        "letter_template"
    ],
    keyMap: {
        "Min Hours Owed": "min_hours_owed",
        "Max Hours Owed": "max_hours_owed",
        "Prev Hours Fulfilled": "prev_hours_fulfilled",
        "Letter Template": "letter_template"
    },
    requiredKeys: ["utorid", "letter_template"],
    primaryKey: ["utorid"],
    dateColumns: [],
    baseName: "applicantMatchingData",
};
