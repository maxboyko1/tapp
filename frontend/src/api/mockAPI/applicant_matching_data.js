import {
    docApiPropTypes,
    documentCallback,
    wrappedPropTypes,
} from "../defs/doc-generation";
import {
    getAttributesCheckMessage,
    findAllById,
    errorUnlessRole,
    MockAPIController
} from "./utils";
import { Applicant } from "./applicants";
import { LetterTemplate } from "./letter_templates";
import { Session } from "./sessions";

export class ApplicantMatchingDatum extends MockAPIController {
    constructor(data) {
        super(data, data.applicantMatchingData);
    }
    validateNew(applicantMatchingDatum) {
        // No uniqueness required, so pass in an empty array ([]) to the verifier
        const message = getAttributesCheckMessage(applicantMatchingDatum, [], {
            session_id: { required: true },
            applicant_id: { required: true },
        });
        if (message) {
            throw new Error(message);
        }
    }
    findAllBySession(session) {
        const matchingSession = new Session(this.data).rawFind(session);
        return findAllById(
            this.data.applicant_matching_data_by_session[matchingSession.id] || [],
            this.ownData
            // Call "find" again to make sure every item gets packaged appropriately
        ).map((x) => new ApplicantMatchingDatum(this.data).find(x));
    }
    getApplicant(applicantMatchingDatum) {
        return new Applicant(this.data).find({
            id: applicantMatchingDatum.applicant_id,
        });
    }
    getLetterTemplate(applicantMatchingDatum) {
        return new LetterTemplate(this.data).find({
            id: applicantMatchingDatum.letter_template_id,
        });
    }
    getActiveConfirmation(applicantMatchingDatum) {
        return new ActiveConfirmation(this.data).findByApplicantMatchingDatum(
            applicantMatchingDatum
        );
    }
    find(applicantMatchingDatum) {
        const matchingApplicantMatchingDatum = this.rawFind(applicantMatchingDatum);
        if (!matchingApplicantMatchingDatum) {
            return matchingApplicantMatchingDatum;
        }
        const ret = { ...matchingApplicantMatchingDatum };
        // compute confirmation_status
        const activeConfirmation = this.getActiveConfirmation(matchingApplicantMatchingDatum);
        if (activeConfirmation) {
            ret.active_confirmation_status = activeConfirmation.status;
            ret.active_confirmation_url_token = activeConfirmation.url_token;
        }
        return ret;
    }
    upsert(applicantMatchingDatum) {
        const upsertedAppointment = this.find(super.upsert(applicantMatchingDatum));
        this.data.applicant_matching_data_by_session[upsertedAppointment.session_id] =
            this.data.applicant_matching_data_by_session[upsertedAppointment.session_id] || [];
        this.data.applicant_matching_data_by_session[upsertedAppointment.session_id].push(
            upsertedAppointment.id
        );
        return this.find(upsertedAppointment);
    }
}

class ActiveConfirmation extends MockAPIController {
    constructor(data) {
        super(data, data.confirmations);
    }
    findByApplicantMatchingDatum(applicantMatchingDatum) {
        const matchingApplicantMatchingDatum = this._ensureApplicantMatchingDatum(
            applicantMatchingDatum
        );
        // As a hack, a `_noActiveConfirmation` flag is added to an appointment
        // if the active confirmation should be ignored.
        if (matchingApplicantMatchingDatum && matchingApplicantMatchingDatum._noActiveConfirmation) {
            return null;
        }
        // confirmations are never deleted, only added to the table, so
        // picking the last one is the same as picking the "newest"
        const confirmations = findAllById(
            [matchingApplicantMatchingDatum.id],
            this.data.confirmations,
            "applicant_matching_datum_id"
        );
        const activeConfirmation = confirmations[confirmations.length - 1];
        return activeConfirmation || null;
    }
    findAllByApplicantMatchingDatum(applicantMatchingDatum) {
        const matchingApplicantMatchingDatum = this._ensureApplicantMatchingDatum(
            applicantMatchingDatum
        );
        // As a hack, a `_noActiveConfirmation` flag is added to an appointment
        // if the active confirmation should be ignored.
        if (matchingApplicantMatchingDatum && matchingApplicantMatchingDatum._noActiveConfirmation) {
            return null;
        }
        // confirmations are never deleted, only added to the table, so
        // picking the last one is the same as picking the "newest"
        const confirmations = findAllById(
            [matchingApplicantMatchingDatum.id],
            this.data.confirmations,
            "applicant_matching_datum_id"
        );
        return confirmations;
    }
    _ensureApplicantMatchingDatum(applicantMatchingDatum) {
        const matchingApplicantMatchingDatum = new ApplicantMatchingDatum(this.data).rawFind(
            applicantMatchingDatum
        );
        if (!matchingApplicantMatchingDatum) {
            throw new Error(
                `Could not find appointment matching ${JSON.stringify(
                    applicantMatchingDatum
                )}`
            );
        }
        return matchingApplicantMatchingDatum;
    }
    getApplicantMatchingDatum(confirmation) {
        return new ApplicantMatchingDatum(this.data).find({
            id: confirmation.applicant_matching_datum_id,
        });
    }
    find(query) {
        // This is where the magic happens. We create all the data needed for the confirmation here.
        const baseConfirmation = this.rawFind(query);
        const applicantMatchingDatum = this.getApplicantMatchingDatum(baseConfirmation);
        const applicant = new ApplicantMatchingDatum(this.data).getApplicant(applicantMatchingDatum);
        const letterTemplate = new ApplicantMatchingDatum(this.data).getLetterTemplate(
            applicantMatchingDatum
        );

        const confirmation = {
            accepted_date: null,
            rejected_date: null,
            withdrawn_date: null,
            signature: "",
            nag_count: 0,
            // All mutable fields should come before `baseConfirmation` is destructured.
            // Fields that come after are computed and cannot be directly set.
            ...baseConfirmation,
            letter_template: letterTemplate.template_file,
            first_name: applicant.first_name,
            last_name: applicant.last_name,
            email: applicant.email,
            min_hours_owed: applicantMatchingDatum.min_hours_owed,
            max_hours_owed: applicantMatchingDatum.max_hours_owed,
            prev_hours_fulfilled: applicantMatchingDatum.prev_hours_fulfilled,
            ta_coordinator_name: "Dr. Coordinator",
            ta_coordinator_email: "coordinator@utoronto.ca",
            url_token: "mock_api_appointment_confirmation_url_token",
        };

        return confirmation;
    }
    withdrawByApplicantMatchingDatum(applicantMatchingDatum) {
        const confirmation = this.findByApplicantMatchingDatum(
            this._ensureApplicantMatchingDatum(applicantMatchingDatum)
        );
        return this.find(
            this.upsert({
                ...confirmation,
                status: "withdrawn",
                withdrawn_date: new Date().toISOString(),
            })
        );
    }
    rejectByApplicantMatchingDatum(applicantMatchingDatum) {
        const confirmation = this.findByApplicantMatchingDatum(
            this._ensureApplicantMatchingDatum(applicantMatchingDatum)
        );
        return this.find(
            this.upsert({
                ...confirmation,
                status: "rejected",
                rejected_date: new Date().toISOString(),
            })
        );
    }
    acceptByApplicantMatchingDatum(applicantMatchingDatum) {
        const confirmation = this.findByApplicantMatchingDatum(
            this._ensureApplicantMatchingDatum(applicantMatchingDatum)
        );
        return this.find(
            this.upsert({
                ...confirmation,
                status: "accepted",
                accepted_date: new Date().toISOString(),
            })
        );
    }
    emailByApplicantMatchingDatum(applicantMatchingDatum) {
        const confirmation = this.findByApplicantMatchingDatum(
            this._ensureApplicantMatchingDatum(applicantMatchingDatum)
        );
        return this.find(
            this.upsert({
                ...confirmation,
                status: "pending",
                emailed_date: new Date().toISOString(),
            })
        );
    }
    nagByApplicantMatchingDatum(applicantMatchingDatum) {
        const confirmation = this.findByApplicantMatchingDatum(
            this._ensureApplicantMatchingDatum(applicantMatchingDatum)
        );
        if (!confirmation.emailed_date) {
            throw new Error(
                `The active confirmation for appointment with id=${applicantMatchingDatum.id} has not been emailed yet, so a nag email cannot be sent`
            );
        }
        return this.find(
            this.upsert({
                ...confirmation,
                nag_count: (confirmation.nag_count || 0) + 1,
            })
        );
    }
    getHistoryByApplicantMatchingDatum(applicantMatchingDatum) {
        const confirmations = this.findAllByApplicantMatchingDatum(
            this._ensureApplicantMatchingDatum(applicantMatchingDatum)
        );
        if (confirmations.length === 0) {
            throw new Error(
                `There is no confirmation history for appointment with id=${applicantMatchingDatum.id}.`
            );
        }
        // Note: allocating memory inside of the sort callback is frowned upon, but this is just a mock API
        confirmations.sort(function (a, b) {
            return new Date(b.emailed_date) - new Date(a.emailed_date);
        });
        return confirmations;
    }
    createByApplicantMatchingDatum(applicantMatchingDatum) {
        const matchingApplicantMatchingDatum = this._ensureApplicantMatchingDatum(applicantMatchingDatum);
        const confirmation = this.findByApplicantMatchingDatum(matchingApplicantMatchingDatum);
        if (
            confirmation &&
            ["pending", "accepted", "rejected", "provisional"].includes(
                confirmation.status
            )
        ) {
            throw new Error(
                `A confirmation already exists for appointment=${JSON.stringify(
                    applicantMatchingDatum
                )}`
            );
        }

        // As a hack, sometimes a `_noActiveConfirmation` flag is set. Make sure to unset this flag
        // before creating an appointment confirmation.
        new ApplicantMatchingDatum(this.data).upsert({
            ...matchingApplicantMatchingDatum,
            _noActiveConfirmation: false,
        });
        return this.upsert(
            this.find(
                this.create({
                    applicant_matching_datum_id: matchingApplicantMatchingDatum.id,
                    status: "provisional",
                })
            )
        );
    }
}

export const applicantMatchingDataRoutes = {
    get: {
        "/sessions/:session_id/applicant_matching_data": documentCallback({
            func: (data, params) => {
                errorUnlessRole(params, "admin");
                return new ApplicantMatchingDatum(data).findAllBySession(params.session_id);
            },
            summary:
                "Get all appointments associated with the session",
            returns: wrappedPropTypes.arrayOf(
                docApiPropTypes.applicant_matching_datum
            ),
        }),
        "/applicant_matching_data/:applicant_matching_datum_id": documentCallback({
            func: (data, params) => {
                errorUnlessRole(params, "admin");
                return new ApplicantMatchingDatum(data).find(params.applicant_matching_datum_id);
            },
            summary: "Get an appointment",
            returns: docApiPropTypes.applicant_matching_datum,
        }),
        "/applicant_matching_data/:applicant_matching_datum_id/active_confirmation": documentCallback({
            func: (data, params) => {
                errorUnlessRole(params, "admin");
                return new ApplicantMatchingDatum(data).getActiveConfirmation(
                    params.applicant_matching_datum_id
                );
            },
            summary: "Get the active confirmation associated with an appointment",
            returns: docApiPropTypes.confirmation,
        }),
        "/applicant_matching_data/:applicant_matching_datum_id/active_confirmation/history": documentCallback({
            func: (data, params) => {
                errorUnlessRole(params, "admin");
                return new ActiveConfirmation(data).getHistoryByApplicantMatchingDatum(
                    params.applicant_matching_datum_id
                );
            },
            summary: "Fetches all appointment confirmations that have previously been emailed.",
            returns: docApiPropTypes.confirmation,
        }),
    },
    post: {
        "/applicant_matching_data": documentCallback({
            func: (data, params, body) => {
                errorUnlessRole(params, "admin");
                const existingAppointment = new ApplicantMatchingDatum(data).find(body);
                if (existingAppointment) {
                    const activeConfirmation = new ApplicantMatchingDatum(data).getActiveConfirmation(
                        existingAppointment
                    );
                    if (!activeConfirmation) {
                        return new ApplicantMatchingDatum(data).upsert(body);
                    }
                    if (
                        ["withdrawn", "provisional"].includes(
                            activeConfirmation.status
                        )
                    ) {
                        // In this case, we can upsert the appointment, but we remove any active confirmation
                        // in the process
                        return new ApplicantMatchingDatum(data).upsert({
                            ...body,
                            _noActiveConfirmation: true,
                        });
                    }
                    throw new Error(
                        `Cannot update an appointment that has an active confirmation with status '${activeConfirmation.status}'`
                    );
                }
                return new ApplicantMatchingDatum(data).upsert(body);
            },
            summary: "Upsert an applicant matching datum",
            posts: docApiPropTypes.applicant_matching_datum,
            returns: docApiPropTypes.applicant_matching_datum,
        }),
        "/applicant_matching_data/:applicant_matching_datum_id/active_confirmation/withdraw": documentCallback({
            func: (data, params) => {
                errorUnlessRole(params, "admin");
                return new ActiveConfirmation(data).withdrawByApplicantMatchingDatum(
                    params.applicant_matching_datum_id
                );
            },
            summary: "Withdraws the active confirmation for the specified appointment",
            returns: docApiPropTypes.confirmation,
        }),
        "/applicant_matching_data/:applicant_matching_datum_id/active_confirmation/reject": documentCallback({
            func: (data, params) => {
                errorUnlessRole(params, "admin");
                return new ActiveConfirmation(data).rejectByApplicantMatchingDatum(
                    params.applicant_matching_datum_id
                );
            },
            summary: "Rejects the active confirmation for the specified appointment",
            returns: docApiPropTypes.confirmation,
        }),
        "/applicant_matching_data/:applicant_matching_datum_id/active_confirmation/accept": documentCallback({
            func: (data, params) => {
                errorUnlessRole(params, "admin");
                return new ActiveConfirmation(data).acceptByApplicantMatchingDatum(
                    params.applicant_matching_datum_id
                );
            },
            summary: "Accepts the active confirmation for the specified appointment",
            returns: docApiPropTypes.confirmation,
        }),
        "/applicant_matching_data/:applicant_matching_datum_id/active_confirmation/create": documentCallback({
            func: (data, params) => {
                errorUnlessRole(params, "admin");
                return new ActiveConfirmation(data).createByApplicantMatchingDatum(
                    params.applicant_matching_datum_id
                );
            },
            summary:
                "Creates a confirmation for the specified appointment, provided there are no active confirmations for this appointment.",
            returns: docApiPropTypes.confirmation,
        }),
        "/applicant_matching_data/:applicant_matching_datum_id/active_confirmation/email": documentCallback({
            func: (data, params) => {
                errorUnlessRole(params, "admin");
                return new ActiveConfirmation(data).emailByApplicantMatchingDatum(
                    params.applicant_matching_datum_id
                );
            },
            summary: "Emails the active confirmation for the specified appointment",
            returns: docApiPropTypes.confirmation,
        }),
        "/applicant_matching_data/:applicant_matching_datum_id/active_confirmation/nag": documentCallback({
            func: (data, params) => {
                errorUnlessRole(params, "admin");
                return new ActiveConfirmation(data).nagByApplicantMatchingDatum(
                    params.applicant_matching_datum_id
                );
            },
            summary:
                "Sends a nag email for the active confirmation for the specified appointment which has already been emailed once",
            returns: docApiPropTypes.confirmation,
        }),
    },
};
