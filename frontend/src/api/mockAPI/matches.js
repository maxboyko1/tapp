import {
    docApiPropTypes,
    documentCallback,
    wrappedPropTypes,
} from "../defs/doc-generation";
import { errorUnlessRole, MockAPIController } from "./utils";

export class Match extends MockAPIController {
    constructor(data) {
        super(data, data.match);
    }
}
export const matchesRoutes = {
    get: {
        "/sessions/:session_id/matches": documentCallback({
            func: () => {
                throw new Error("not implemented");
            },
            summary: "Get all matches associated with the session",
            returns: wrappedPropTypes.arrayOf(docApiPropTypes.match),
        }),
    },
    post: {
        "/matches": documentCallback({
            func: (data, params, body) => {
                errorUnlessRole(params, "admin");
                return new Match(data).upsert(body);
            },
            summary: "Upsert a match",
            posts: docApiPropTypes.match,
            returns: docApiPropTypes.match,
        }),
    },
};
