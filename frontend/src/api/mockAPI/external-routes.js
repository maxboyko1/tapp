import { documentCallback, wrappedPropTypes } from "../defs/doc-generation";

export const externalRoutes = {
    get: {
        "/external/ddahs/:token": documentCallback({
            func: () => {
                throw new Error("Not implemented in Mock API");
            },
            summary: "Get the contents of ddah as `html` or `pdf`",
            returns: wrappedPropTypes.any,
        }),
        "/external/ddahs/:token/view": documentCallback({
            func: () => {
                throw new Error("Not implemented in Mock API");
            },
            summary: "View a ddah with an accept dialog",
            returns: wrappedPropTypes.any,
        }),
        "/external/ddahs/:token/details": documentCallback({
            func: () => {
                throw new Error("Not implemented in Mock API");
            },
            summary: "Get JSON information about a DDAH",
            returns: wrappedPropTypes.any,
        }),
        "/external/contracts/:token": documentCallback({
            func: () => {
                throw new Error("Not implemented in Mock API");
            },
            summary: "Get an offer as `html` or `pdf`",
            returns: wrappedPropTypes.any,
        }),
        "/external/contracts/:token/view": documentCallback({
            func: () => {
                throw new Error("Not implemented in Mock API");
            },
            summary: "View an offer with an accept dialog",
            returns: wrappedPropTypes.any,
        }),
        "/external/contracts/:token/details": documentCallback({
            func: () => {
                throw new Error("Not implemented in Mock API");
            },
            summary: "Get a JSON object with all the details about the offer",
            returns: wrappedPropTypes.any,
        }),
        "/external/letters/:token": documentCallback({
            func: () => {
                throw new Error("Not implemented in Mock API");
            },
            summary: "Get an appointment confirmation as `html` or `pdf`",
            returns: wrappedPropTypes.any,
        }),
        "/external/letters/:token/view": documentCallback({
            func: () => {
                throw new Error("Not implemented in Mock API");
            },
            summary: "View an appointment confirmation with an accept dialog",
            returns: wrappedPropTypes.any,
        }),
        "/external/letters/:token/details": documentCallback({
            func: () => {
                throw new Error("Not implemented in Mock API");
            },
            summary: "Get a JSON object with all the details about the appointment confirmation",
            returns: wrappedPropTypes.any,
        }),
        "/external/postings/:token": documentCallback({
            func: () => {
                throw new Error("Not implemented in Mock API");
            },
            summary:
                "Get a JSON object with the survey_js data for the posting",
            returns: wrappedPropTypes.any,
        }),
        "/external/files/:token": documentCallback({
            func: () => {
                throw new Error("Not implemented in Mock API");
            },
            summary: "Return the file corresponding to the specified token",
            returns: wrappedPropTypes.any,
        }),
    },
    post: {
        "/external/ddahs/:token/accept": documentCallback({
            func: () => {
                throw new Error("Not implemented in Mock API");
            },
            summary: "Set a ddah as accepted",
            returns: wrappedPropTypes.any,
        }),
        "/external/contracts/:token/accept": documentCallback({
            func: () => {
                throw new Error("Not implemented in Mock API");
            },
            summary: "Accept an offer",
            returns: wrappedPropTypes.any,
        }),
        "/external/contracts/:token/reject": documentCallback({
            func: () => {
                throw new Error("Not implemented in Mock API");
            },
            summary: "Reject an offer",
            returns: wrappedPropTypes.any,
        }),
        "/external/letters/:token/accept": documentCallback({
            func: () => {
                throw new Error("Not implemented in Mock API");
            },
            summary: "Accept an appointment confirmation",
            returns: wrappedPropTypes.any,
        }),
        "/external/letters/:token/reject": documentCallback({
            func: () => {
                throw new Error("Not implemented in Mock API");
            },
            summary: "Reject an appointment confirmation",
            returns: wrappedPropTypes.any,
        }),
        "/external/postings/:token/submit": documentCallback({
            func: () => {
                throw new Error("Not implemented in Mock API");
            },
            summary: "Submit survey_js data after filling out a posting",
            posts: wrappedPropTypes.any,
            returns: wrappedPropTypes.any,
        }),
    },
};
