import {
    docApiPropTypes,
    documentCallback,
    wrappedPropTypes,
} from "../defs/doc-generation";
import { errorUnlessRole, MockAPIController } from "./utils";

export class ApplicantMatchingDatum extends MockAPIController {
    constructor(data) {
        super(data, data.applicantMatchingData);
    }
}
export const applicantMatchingDataRoutes = {
    get: {
        "/sessions/:session_id/applicant_matching_data": documentCallback({
            func: () => {
                throw new Error("not implemented");
            },
            summary:
                "Get all applicant matching data associated with the session",
            returns: wrappedPropTypes.arrayOf(
                docApiPropTypes.applicant_matching_datum
            ),
        }),
    },
    post: {
        "/applicant_matching_data": documentCallback({
            func: (data, params, body) => {
                errorUnlessRole(params, "admin");
                return new ApplicantMatchingDatum(data).upsert(body);
            },
            summary: "Upsert an applicant matching datum",
            posts: docApiPropTypes.applicant_matching_datum,
            returns: docApiPropTypes.applicant_matching_datum,
        }),
    },
};
