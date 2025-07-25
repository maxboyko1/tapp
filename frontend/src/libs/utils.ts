import React from "react";
import { shallowEqual } from "react-redux";
import { Session } from "../api/defs/types";

/**
 * Adds the arguments passed in.
 *
 * @export
 * @param {} numbers
 * @returns {number}
 */
export function sum(...numbers: number[]) {
    let ret = 0;
    for (const num of numbers) {
        ret += +num;
    }
    return ret;
}

/**
 * Compare the two input strings.
 * @param {string} str1
 * @param {string} str2
 * @returns
 */
export function compareString(str1: string, str2: string) {
    if (str1 > str2) {
        return 1;
    } else if (str1 < str2) {
        return -1;
    }
    return 0;
}

/**
 * Capitalizes the input string. The function only capitalizes the first word if there are multiple words in the input string.
 * If `word` isn't a string, it is coerced.
 * @param word a single word.
 * @returns
 */
export function capitalize(word: string | null | undefined): string {
    if (!word) {
        return "";
    }
    return word.charAt(0).toUpperCase() + word.slice(1);
}

/**
 * Trims the input string. If the `x` is not a string, it is
 * coerced
 *
 * @param {string} x
 * @returns
 */
export function strip(x: string | number | null | undefined): string {
    if (x == null) {
        return "";
    }
    return ("" + x).trim();
}

/**
 * Formats the input date string to be human readable
 * Input string is of the form 2019-01-01T00:00:00.000Z
 * Output string is of the form January 1, 2019
 * @param {string} dateString
 */
export function formatDate(dateString: string): string {
    if (!dateString) {
        return dateString;
    }
    // Normalize the date string so we can compensate for timezone issues.
    // This string is now formatted YYYY-MM-DD
    const processedDate = new Date(dateString).toJSON() || "";
    const normalizedDateString = processedDate.slice(0, 10);
    // Add timezone offset information so that Javascript will
    // interpret the date in the current timezone
    const date = new Date(`${normalizedDateString}T00:00:00.000`);
    return `${date.toLocaleDateString("en-CA", {
        month: "short",
        year: "numeric",
        day: "numeric",
    })}`;
}

/**
 * Formats the input date string to be human readable
 * Input string is of the form 2019-01-01T00:00:00.000Z
 * Output string is of the form "2018-12-31, 7:00:00 p.m."
 * @param {string} dateString
 */
export function formatDateTime<T extends string | null | undefined>(
    dateString: T
): T {
    if (!dateString || dateString == null) {
        return dateString;
    }
    const date = new Date(dateString!);
    return date.toLocaleString("en-CA") as T;
}

/**
 * Map specific offer/confirmation statuses to predefined display colors.
 */
export function getStatusColor(status: string | null, theme: any) {
    switch (status) {
        case "provisional":
            return theme.palette.secondary.main;
        case "pending":
            return theme.palette.info.main;
        case "accepted":
            return theme.palette.success.main;
        case "withdrawn":
            return theme.palette.warning.main;
        case "rejected":
            return theme.palette.error.main;
        default:
            return theme.palette.text.primary;
    }
}

/**
 * Attempt to parse a local date string of the form YYYY-MM-DD and return
 * a Date object if successful, or null if the string is invalid. 
 */
export function parseLocalDate(dateStr?: string | null): Date | null {
    if (!dateStr) return null;
    const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) return null;
    const [, year, month, day] = match;
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return isNaN(date.getTime()) ? null : date;
}

/**
 * Checks if the active user is a TAPP administrator.
 * @param activeUser The user object to check.
 * @returns True if the user is a TAPP admin, false otherwise.
 */
export function isTappAdmin(activeUser: any): boolean {
    const tappAdmins = (import.meta.env.VITE_TAPP_ADMINS || "")
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean);
    return (
        !!activeUser &&
        typeof activeUser === "object" &&
        "utorid" in activeUser &&
        tappAdmins.includes((activeUser as any).utorid)
    );
}

/**
 * Format a url for downloading. In production, this is the
 * identity function. In development mode, this function replaces
 * port `8000` with `3000` so that non-json data can be downloaded from the
 * backend.
 *
 * @param {string} url
 */
let formatDownloadUrl = (url: string) => url;

if (import.meta.env.VITE_DEV_FEATURES) {
    formatDownloadUrl = (url: string) => {
        return `http://localhost:3000${url}`;
    };
}

export { formatDownloadUrl };

/**
 * Returns all the elements that are in `a` but not `b`.
 *
 * @export
 * @template T
 * @param {T[]} a
 * @param {any[]} b
 * @returns {T[]}
 */
export function arrayDiff<T>(a: T[], b: any[]): T[] {
    return a.filter((x) => !b.includes(x));
}

// Debounce hook from https://dev.to/gabe_ragland/debouncing-with-react-hooks-jci
/**
 * Debounce a value. This hook will continue returning the initially passed in `value`
 * until `delay` milliseconds have passed. After the delay, the most recently-passed-in
 * value is returned.
 *
 * @export
 * @param {*} value
 * @param {number} delay
 * @returns
 */
export function useDebounce(value: any, delay: number) {
    // State and setters for debounced value
    const [debouncedValue, setDebouncedValue] = React.useState<any>(value);

    React.useEffect(
        () => {
            if (shallowEqual(value, debouncedValue)) {
                return;
            }
            // Set debouncedValue to value (passed in) after the specified delay
            const handler = setTimeout(() => {
                setDebouncedValue(value);
            }, delay);

            // Return a cleanup function that will be called every time ...
            // ... useEffect is re-called. useEffect will only be re-called ...
            // ... if value changes (see the inputs array below).
            // This is how we prevent debouncedValue from changing if value is ...
            // ... changed within the delay period. Timeout gets cleared and restarted.
            // To put it in context, if the user is typing within our app's ...
            // ... search box, we don't want the debouncedValue to update until ...
            // ... they've stopped typing for more than 500ms.
            return () => {
                clearTimeout(handler);
            };
        },
        // Only re-call effect if value changes
        // We purposely don't pass in `debounceValue` so that we don't get
        // stuck in a loop. However, eslint complains about not passing in
        // `debounceValue`.
        // eslint-disable-next-line
        [value, delay]
    );

    return debouncedValue;
}

/**
 * Given a list of sessions, use a heuristic to pick the "current"
 * session. If the session dates of all sessions are too far from the current
 * date, `null` is returned.
 */
export function guessActiveSession(sessions: Session[]): Session | null {
    // If there is a session whose start date is less than a month away,
    // pick that session. This takes precedence over a session that we're "in"
    // because if we're near the end of a session, we're probably interested in the
    // upcoming TAs rather than the current TAs.
    const oneMonth: number = +new Date("2020-02-01") - +new Date("2020-01-01");
    const now = +new Date();
    for (const session of sessions) {
        const sessionStart = +new Date(session.start_date);
        const diff = sessionStart - now;
        if (diff < oneMonth && diff >= 0) {
            return session;
        }
    }
    // Next, we check if we're in a current session or have passed it by at most a month
    for (const session of sessions) {
        const sessionStart = +new Date(session.start_date);
        const sessionEnd = +new Date(session.end_date);
        if (now <= sessionEnd + oneMonth && now >= sessionStart) {
            return session;
        }
    }

    return null;
}

/**
 * Formats the input "number" string to 2 decimal places.
 * @param {string} moneyString
 * @returns {string}
 */
export function formatMoney(moneyString: string): string {
    if (!isFinite(parseFloat(moneyString))) {
        return moneyString;
    }
    return parseFloat(moneyString).toFixed(2);
}

/**
 * Round `x` to `places` number of decimal places.
 */
export function round(x: number, places: number = 0) {
    return Math.round(x * Math.pow(10, places)) / Math.pow(10, places);
}
