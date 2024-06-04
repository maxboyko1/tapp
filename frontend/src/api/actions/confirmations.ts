import {
    FETCH_ONE_CONFIRMATION_SUCCESS,
    SET_CONFIRMATION_ACCEPTED_SUCCESS,
    SET_CONFIRMATION_REJECTED_SUCCESS,
    CONFIRMATION_CREATE_SUCCESS,
    CONFIRMATION_EMAIL_SUCCESS,
    CONFIRMATION_NAG_SUCCESS,
    CONFIRMATION_WITHDRAW_SUCCESS,
    FETCH_CONFIRMATIONS_FOR_APPLICANT_MATCHING_DATUM_SUCCESS,
} from "../constants";
import { fetchError } from "./errors";
import { actionFactory, HasId, validatedApiDispatcher } from "./utils";
import { apiGET, apiPOST } from "../../libs/api-utils";
import { fetchApplicantMatchingDatum } from "./applicant_matching_data";
import { activeRoleSelector } from "./users";
import { ApplicantMatchingDatum, RawConfirmation } from "../defs/types";

// actions
// XXX These actions don't actually do anything ATM; They're here in case we want to incorporate
// this information into the reducer at some point.
export const fetchConfirmationSuccess = actionFactory<RawConfirmation>(
    FETCH_ONE_CONFIRMATION_SUCCESS
);
export const setConfirmationAcceptedSuccess = actionFactory<RawConfirmation>(
    SET_CONFIRMATION_ACCEPTED_SUCCESS
);
export const setConfirmationRejectedSuccess = actionFactory<RawConfirmation>(
    SET_CONFIRMATION_REJECTED_SUCCESS
);
export const confirmationCreateSuccess = actionFactory<RawConfirmation>(CONFIRMATION_CREATE_SUCCESS);
export const confirmationEmailSuccess = actionFactory<RawConfirmation>(CONFIRMATION_EMAIL_SUCCESS);
export const confirmationNagSuccess = actionFactory<RawConfirmation>(CONFIRMATION_NAG_SUCCESS);
export const confirmationWithdrawSuccess = actionFactory<RawConfirmation>(
    CONFIRMATION_WITHDRAW_SUCCESS
);

export const fetchConfirmationsForApplicantMatchingDatumSuccess = actionFactory<{
    applicant_matching_datum_id: number;
    confirmations: RawConfirmation[];
}>(FETCH_CONFIRMATIONS_FOR_APPLICANT_MATCHING_DATUM_SUCCESS);

// dispatchers
export const fetchConfirmationHistoryForApplicantMatchingDatum = validatedApiDispatcher({
    name: "fetchConfirmationHistoryForApplicantMatchingDatum",
    description:
        "Fetch the history of all confirmations associated with an applicant matching datum",
    onErrorDispatch: (e) => fetchError(e.toString()),
    dispatcher: (payload: HasId) => async (dispatch, getState) => {
        const role = activeRoleSelector(getState());
        const { id: applicantMatchingDatumId } = payload;
        const data = (await apiGET(
            `/${role}/applicant_matching_data/${applicantMatchingDatumId}/active_confirmation/history`
        )) as RawConfirmation[];
        dispatch(
            fetchConfirmationsForApplicantMatchingDatumSuccess({
                applicant_matching_datum_id: applicantMatchingDatumId,
                confirmations: data,
            })
        );
    },
});

export const fetchActiveConfirmationForApplicantMatchingDatum = validatedApiDispatcher({
    name: "fetchActiveConfirmationForApplicantMatchingDatum",
    description: "Fetch the confirmation currently associated with an applicant matching datum",
    onErrorDispatch: (e) => fetchError(e.toString()),
    dispatcher: (payload: HasId) => async (dispatch, getState) => {
        const role = activeRoleSelector(getState());
        const data = (await apiGET(
            `/${role}/applicant_matching_data/${payload.id}/active_confirmation`
        )) as RawConfirmation;
        dispatch(fetchConfirmationSuccess(data));
        return data;
    },
});

export const setConfirmationForApplicantMatchingDatumAccepted = validatedApiDispatcher({
    name: "setConfirmationForApplicantMatchingDatumAccepted",
    description: "Set a confirmation as accepted",
    onErrorDispatch: (e) => fetchError(e.toString()),
    dispatcher: (applicantMatchingDatum: ApplicantMatchingDatum) => async (dispatch, getState) => {
        const role = activeRoleSelector(getState());
        const data = await apiPOST(
            `/${role}/applicant_matching_data/${applicantMatchingDatum.id}/active_confirmation/accept`
        );
        dispatch(setConfirmationAcceptedSuccess(data));
        // After we update a confirmation, we should refetch the applicant matching datum to make sure
        // there isn't stale data
        await dispatch(fetchApplicantMatchingDatum(applicantMatchingDatum));
    },
});

export const setConfirmationForApplicantMatchingDatumRejected = validatedApiDispatcher({
    name: "setConfirmationForApplicantMatchingDatumRejected",
    description: "Set a confirmation as rejected",
    onErrorDispatch: (e) => fetchError(e.toString()),
    dispatcher: (applicantMatchingDatum: ApplicantMatchingDatum) => async (dispatch, getState) => {
        const role = activeRoleSelector(getState());
        const data = await apiPOST(
            `/${role}/applicant_matching_data/${applicantMatchingDatum.id}/active_confirmation/reject`
        );
        dispatch(setConfirmationRejectedSuccess(data));
        // After we update a confirmation, we should refetch the applicant matching datum to make sure
        // there isn't stale data
        await dispatch(fetchApplicantMatchingDatum(applicantMatchingDatum));
    },
});

export const confirmationForApplicantMatchingDatumWithdraw = validatedApiDispatcher({
    name: "confirmationForApplicantMatchingDatumWithdraw",
    description: "Withdraw a confirmation",
    onErrorDispatch: (e) => fetchError(e.toString()),
    dispatcher: (applicantMatchingDatum: ApplicantMatchingDatum) => async (dispatch, getState) => {
        const role = activeRoleSelector(getState());
        const data = await apiPOST(
            `/${role}/applicant_matching_data/${applicantMatchingDatum.id}/active_confirmation/withdraw`
        );
        dispatch(confirmationWithdrawSuccess(data));
        // After we update a confirmation, we should refetch the applicant matching datum to make sure
        // there isn't stale data
        await dispatch(fetchApplicantMatchingDatum(applicantMatchingDatum));
    },
});

export const confirmationForApplicantMatchingDatumCreate = validatedApiDispatcher({
    name: "confirmationForApplicantMatchingDatumCreate",
    description: "Create a confirmation",
    onErrorDispatch: (e) => fetchError(e.toString()),
    dispatcher: (applicantMatchingDatum: ApplicantMatchingDatum) => async (dispatch, getState) => {
        const role = activeRoleSelector(getState());
        const data = await apiPOST(
            `/${role}/applicant_matching_data/${applicantMatchingDatum.id}/active_confirmation/create`
        );
        dispatch(confirmationCreateSuccess(data));
        // After we update a confirmation, we should refetch the applicant matching datum to make sure
        // there isn't stale data
        await dispatch(fetchApplicantMatchingDatum(applicantMatchingDatum));
    },
});

export const confirmationForApplicantMatchingDatumEmail = validatedApiDispatcher({
    name: "confirmationForApplicantMatchingDatumEmail",
    description: "Email a confirmation letter",
    onErrorDispatch: (e) => fetchError(e.toString()),
    dispatcher: (applicantMatchingDatum: ApplicantMatchingDatum) => async (dispatch, getState) => {
        const role = activeRoleSelector(getState());
        const data = await apiPOST(
            `/${role}/applicant_matching_data/${applicantMatchingDatum.id}/active_confirmation/email`
        );
        dispatch(confirmationEmailSuccess(data));
        // After we update a confirmation, we should refetch the applicant matching datum to make sure
        // there isn't stale data
        await dispatch(fetchApplicantMatchingDatum(applicantMatchingDatum));
    },
});

export const confirmationForApplicantMatchingDatumNag = validatedApiDispatcher({
    name: "confirmationForApplicantMatchingDatumNag",
    description: "Send a nag email for a confirmation letter",
    onErrorDispatch: (e) => fetchError(e.toString()),
    dispatcher: (applicantMatchingDatum: ApplicantMatchingDatum) => async (dispatch, getState) => {
        const role = activeRoleSelector(getState());
        const data = await apiPOST(
            `/${role}/applicant_matching_data/${applicantMatchingDatum.id}/active_confirmation/nag`
        );
        dispatch(confirmationNagSuccess(data));
        // After we update a confirmation, we should refetch the applicant matching datum to make sure
        // there isn't stale data
        await dispatch(fetchApplicantMatchingDatum(applicantMatchingDatum));
    },
});
