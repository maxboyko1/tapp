import { Applicant, DutyOutline, MinimalDdah } from "../../api/defs/types";
import {
    SpreadsheetRowMapper,
    matchByUtoridOrName,
} from "../../libs/import-export";

/**
 * Convert imported spreadsheet or JSON data into an
 * array of minimal DDAH objects.
 *
 * @param {({
 *     fileType: "json" | "spreadsheet";
 *     data: any;
 * })} data
 * @param {Applicant[]} applicants
 * @returns {MinimalDdah[]}
 */
export function normalizeDdahImports(
    data: {
        fileType: "json" | "spreadsheet";
        data: any;
    },
    applicants: Applicant[],
    log = true,
    positionCodeOverride?: string
): MinimalDdah[] {
    const ret: MinimalDdah[] = [];

    function hasValue(value: unknown) {
        if (value == null) {
            return false;
        }
        if (typeof value === "string") {
            return value.trim() !== "";
        }
        return true;
    }

    if (data.fileType === "json") {
        let unwrapped: MinimalDdah[] = data.data;
        if ((unwrapped as any).ddahs) {
            unwrapped = (unwrapped as any).ddahs;
        }
        for (const ddah of unwrapped) {
            ret.push({
                ...ddah,
                duties: (ddah.duties || []).map((duty) => ({
                    hours: Number(duty.hours || 0),
                    description: duty.description || "",
                    is_fixed: !!duty.is_fixed,
                })),
            });
        }
    }

    if (data.fileType === "spreadsheet") {
        const unwrapped = data.data;
        // Get an upper bound for the maximum number of duties that the spreadsheet might have
        let maxDuties = Math.round(
            Math.max(
                ...unwrapped.map((row: object) => Object.keys(row).length),
                0
            ) / 2
        );
        // If cells are blank, SheetJS does not import them. Therefore,
        // the max number of cells found will be an under-count. This
        // caused issue https://github.com/uoft-tapp/tapp/issues/575
        // As an ugly hack, we just assume there's no more than 50 additional duties.
        maxDuties += 50;

        // We need to generate a keymap for all the likely column names
        const keyMap: { [key: string]: string } = {
            Position: "position_code",
            "First Name": "first_name",
            "Given Name": "first_name",
            First: "first_name",
            "Last Name": "last_name",
            Surname: "last_name",
            "Family Name": "last_name",
            Last: "last_name",
        };
        // We will also add `Hours #` and `Duty #` to the keymap for the number of duties in our range
        for (let i = 0; i <= maxDuties; i++) {
            keyMap[`Duty ${i}`] = `duty_${i}`;
            keyMap[`Hours ${i}`] = `hours_${i}`;
            keyMap[`Fixed Duty ${i}`] = `fixed_duty_${i}`;
            keyMap[`Fixed Hours ${i}`] = `fixed_hours_${i}`;
            if (i < 10) {
                keyMap[`Duty 0${i}`] = `duty_${i}`;
                keyMap[`Hours 0${i}`] = `hours_${i}`;
                keyMap[`Fixed Duty 0${i}`] = `fixed_duty_${i}`;
                keyMap[`Fixed Hours 0${i}`] = `fixed_hours_${i}`;
            }
        }

        // SpreadsheetRowMapper will perform fuzzy matching of column names for us.
        const rowMapper = new SpreadsheetRowMapper({
            keys: ["position_code", "first_name", "last_name", "utorid"],
            keyMap,
        });

        for (const row of unwrapped) {
            const normalized: {
                [key: string]: any;
            } = rowMapper.formatRow(row, log);
            if (positionCodeOverride) {
                normalized.position_code = positionCodeOverride;
            }
            if (normalized.utorid == null) {
                // If a UTORid column was not specified, we need to manually search the applicants for
                // someone matching the first/last name. `matchByUtoridOrName` will succeed or throw an error,
                // so if we make it past this line of code, we've successfully found a match.
                const applicant = matchByUtoridOrName(
                    `${normalized.first_name} ${normalized.last_name}`,
                    applicants
                ) as Applicant;
                normalized.utorid = applicant.utorid;
                delete normalized.first_name;
                delete normalized.last_name;
            }
            // Now we need to condense duties to a list
            // The easiest way is to just hunt for them
            const duties: {
                description: string;
                hours: number;
                is_fixed: boolean;
            }[] = [];

            for (let i = 0; i <= maxDuties; i++) {
                const duty = normalized[`fixed_duty_${i}`];
                const hours = normalized[`fixed_hours_${i}`];
                if (!hasValue(duty) && !hasValue(hours)) {
                    delete normalized[`fixed_duty_${i}`];
                    delete normalized[`fixed_hours_${i}`];
                    continue;
                }

                duties.push({
                    description: duty || "",
                    hours: Number(hours || 0),
                    is_fixed: true,
                });
                delete normalized[`fixed_duty_${i}`];
                delete normalized[`fixed_hours_${i}`];
            }

            for (let i = 0; i <= maxDuties; i++) {
                const duty = normalized[`duty_${i}`];
                const hours = normalized[`hours_${i}`];
                if (!hasValue(duty) && !hasValue(hours)) {
                    delete normalized[`duty_${i}`];
                    delete normalized[`hours_${i}`];
                    continue;
                }

                duties.push({
                    description: duty || "",
                    hours: Number(hours || 0),
                    is_fixed: false,
                });
                delete normalized[`duty_${i}`];
                delete normalized[`hours_${i}`];
            }
            ret.push({
                position_code: normalized.position_code,
                applicant: normalized.utorid,
                duties,
            });
        }
    }

    return ret;
}

/**
 * Helper to render an individual duty in a string format for comparison during validation.
 * 
 * @param duty 
 * @returns 
 */
function dutyHash(duty: DutyOutline) {
    return `${Number(duty.hours)}::${String(duty.description).trim()}`;
}

/**
 * Validate that the DDAH duties being imported include the expected fixed duties as specified in
 * the DDAH outline for this session.
 * 
 * @param ddahs 
 * @param outline 
 * @param isAdmin 
 */
export function validateImportedDdahsAgainstOutline(
    ddahs: MinimalDdah[],
    outline: DutyOutline[],
    isAdmin: boolean = false,
) {
    const expectedFixed = (outline || []).map(dutyHash).sort();
    const outlineDutyList = (outline || [])
        .map((duty) => `${duty.hours}h - ${String(duty.description).trim()};`)
        .join("\n");

    for (const ddah of ddahs) {
        const actualFixed = (ddah.duties || [])
            .filter((duty) => duty.is_fixed)
            .map(dutyHash)
            .sort();

        if (expectedFixed.length === actualFixed.length) {
            const same = expectedFixed.every(
                (expected, idx) => expected === actualFixed[idx]
            );
            if (same) {
                continue;
            }
        }

        // Error for instructors, explaining what specific fixed duties are expected in the import file
        if (!isAdmin) {
            const expectedSuffix = outlineDutyList ? `${outlineDutyList}` : "none.";
            throw new Error(
                `The duties specification for ${ddah.position_code} (${ddah.applicant}) must include the following fixed duties: ${expectedSuffix}`
            );
        }

        // Error for admins, notifying to refer to the DDAH outline for proper fixed duties format
        throw new Error(
            `Fixed duties in the import for ${ddah.position_code} (${ddah.applicant}) do not match this session's DDAH outline.`
        );
    }
}
