// for json containing object data, we do not need another helper function
// to convert undefined to null since in dataToFile function in "./data-to-file"
// we use JSON.stringify() which will do the conversion

import { CellType } from "./prepare-spreadsheet";

/**
 * Normalize spreadsheet data:
 * - Convert undefined to null
 * - Truncate any string longer than 32,767 characters (spreadsheet cell limit)
 *
 * @exports
 * @param {(number | string | null | undefined)[][]} items
 * @returns {(number | string | null)[][]}
 */
const CELL_LENGTH_LIMIT = 32767;

export function normalizeSpreadsheet(
    items: CellType[][]
): (number | string | null)[][] {
    return items.map((row) =>
        row.map((val) => {
            if (val === undefined) return null;
            if (typeof val === "string" && val.length > CELL_LENGTH_LIMIT) {
                return val.slice(0, CELL_LENGTH_LIMIT - 3) + "...";
            }
            return val;
        })
    );
}