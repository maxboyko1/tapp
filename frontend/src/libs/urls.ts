/*
 * A collection of utility functions for interfacing with urls
 */

/**
 * Try to parse `s` as a native javascript type. E.g., "45.6" will
 * be parsed as a number, "true" will be parsed as `true`, "[]"
 * will be parsed as an empty array.
 *
 * @param {string} s
 * @returns
 */
function stringToNativeType(s: string) {
    if (typeof s === "string" && s !== "" && !Number.isNaN(+s)) {
        return +s;
    }
    try {
        return JSON.parse(s);
    } catch {
        return s;
    }
}

function parseURLSearchString(s: string) {
    const searchParams = new URLSearchParams(s);
    const ret: Record<string, any> = {};
    for (const [key, val] of searchParams.entries()) {
        ret[key] = stringToNativeType(val);
    }
    return ret;
}

export { stringToNativeType, parseURLSearchString };
