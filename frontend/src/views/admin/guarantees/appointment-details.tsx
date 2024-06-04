import React from "react";
import { useSelector } from "react-redux";
import { guaranteeTableSelector } from "./actions";
import {
    applicantMatchingDataSelector,
    fetchConfirmationHistoryForApplicantMatchingDatum,
} from "../../../api/actions";
import { Button, Modal, Alert, Spinner } from "react-bootstrap";
import { Confirmation } from "../../../api/defs/types";
import {
    capitalize,
    formatDate,
    formatDateTime,
    formatDownloadUrl,
} from "../../../libs/utils";
import { ActionButton } from "../../../components/action-buttons";
import { FaSearch, FaSearchDollar } from "react-icons/fa";
import { useThunkDispatch } from "../../../libs/thunk-dispatch";

function ConfirmationHistoryDetails({ confirmations }: { confirmations: Confirmation[] }) {
    if (confirmations.length === 0) {
        return <span>No Letter Sent</span>;
    }
    return (
        <table className="confirmation-history-details-table">
            <thead>
                <tr>
                    <th></th>
                    <th>Status</th>
                    <th>Min Hours Owed</th>
                    <th>Max Hours Owed</th>
                    <th>Hours Previously Fulfilled</th>
                    <th>Emailed Date</th>
                    <th>Accepted Date</th>
                    <th>Rejected Date</th>
                    <th>Withdrawn Date</th>
                </tr>
            </thead>
            <tbody>
                {(confirmations || []).map((confirmation, i) => {
                    const url = `/public/letters/${confirmation.url_token}.pdf`;
                    return (
                        <tr key={i}>
                            <td>
                                <Button
                                    href={formatDownloadUrl(url)}
                                    variant="light"
                                    size="sm"
                                    className="py-0"
                                    title="Download letter PDF"
                                >
                                    <FaSearch />
                                </Button>
                            </td>
                            <td className={`status ${confirmation.status}`}>
                                {capitalize(confirmation.status)}
                            </td>
                            <td className="number">{confirmation.min_hours_owed}</td>
                            <td className="number">{confirmation.max_hours_owed}</td>
                            <td className="number">{confirmation.prev_hours_fulfilled}</td>
                            <td
                                title={formatDateTime(
                                    confirmation.emailed_date || undefined
                                )}
                            >
                                {formatDate(confirmation.emailed_date || "")}
                            </td>
                            <td
                                title={formatDateTime(
                                    confirmation.accepted_date || undefined
                                )}
                            >
                                {formatDate(confirmation.accepted_date || "")}
                            </td>
                            <td
                                title={formatDateTime(
                                    confirmation.rejected_date || undefined
                                )}
                            >
                                {formatDate(confirmation.rejected_date || "")}
                            </td>
                            <td
                                title={formatDateTime(
                                    confirmation.withdrawn_date || undefined
                                )}
                            >
                                {formatDate(confirmation.withdrawn_date || "")}
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
}

export function ConnectedApplicantMatchingDatumDetails({
    applicantMatchingDatumId,
}: {
    applicantMatchingDatumId: number;
}) {
    const applicantMatchingData = useSelector(applicantMatchingDataSelector);
    const applicantMatchingDatum = applicantMatchingData.find((a) => a.id === applicantMatchingDatumId);
    const applicantMatchingDatumNotFound = !applicantMatchingDatum;
    const dispatch = useThunkDispatch();

    React.useEffect(() => {
        if (applicantMatchingDatumNotFound) {
            return;
        }
        dispatch(fetchConfirmationHistoryForApplicantMatchingDatum({ id: applicantMatchingDatumId }));
    }, [applicantMatchingDatumId, dispatch, applicantMatchingDatumNotFound]);

    if (!applicantMatchingDatum) {
        return <div>No Appointment found with ID "{applicantMatchingDatumId}"</div>;
    }

    return (
        <table className="appointment-details-table">
            <tbody>
                <tr>
                    <th>Applicant Name</th>
                    <td>
                        {applicantMatchingDatum.applicant.last_name},{" "}
                        {applicantMatchingDatum.applicant.first_name}
                    </td>
                </tr>
                <tr>
                    <th>Student Number</th>
                    <td>{applicantMatchingDatum.applicant.student_number}</td>
                </tr>
                <tr>
                    <th>Minimum Hours Owed</th>
                    <td>{applicantMatchingDatum.min_hours_owed}</td>
                </tr>
                <tr>
                    <th>Maximum Hours Owed</th>
                    <td>{applicantMatchingDatum.max_hours_owed}</td>
                </tr>
                <tr>
                    <th>Hours Previously Fulfilled</th>
                    <td>{applicantMatchingDatum.prev_hours_fulfilled}</td>
                </tr>
                <tr>
                    <th>Appointment Confirmation Status</th>
                    <td className={`status ${applicantMatchingDatum.active_confirmation_status}`}>
                        {capitalize(
                            applicantMatchingDatum.active_confirmation_status || "No Letter Sent"
                        )}
                    </td>
                </tr>
                <tr>
                    <th>Appointment Confirmation History</th>
                    <td>
                        {applicantMatchingDatum.confirmations ? (
                            <ConfirmationHistoryDetails confirmations={applicantMatchingDatum.confirmations} />
                        ) : (
                            <Spinner
                                animation="border"
                                size="sm"
                                className="mr-1"
                            />
                        )}
                    </td>
                </tr>
            </tbody>
        </table>
    );
}

export function ConnectedViewApplicantMatchingDatumDetailsAction() {
    const applicantMatchingData = useSelector(applicantMatchingDataSelector);
    const { selectedApplicantMatchingDatumIds } = useSelector<
        any,
        { selectedApplicantMatchingDatumIds: Number[] }
    >(guaranteeTableSelector);
    const selectedApplicantMatchingData = applicantMatchingData.filter((applicantMatchingDatum) =>
        selectedApplicantMatchingDatumIds.includes(applicantMatchingDatum.id)
    );
    const [dialogVisible, setDialogVisible] = React.useState<boolean>(false);

    let applicantMatchingDatumDetails: JSX.Element | JSX.Element[] = (
        <Alert variant="info">
            There are no selected appointments. You must select appointment items to see their details.
        </Alert>
    );
    if (selectedApplicantMatchingData.length > 0) {
        applicantMatchingDatumDetails = selectedApplicantMatchingData.map((applicantMatchingDatum, i) => {
            let split = i === 0 ? null : <hr />;
            return (
                <React.Fragment key={i}>
                    {split}
                    <ConnectedApplicantMatchingDatumDetails
                        applicantMatchingDatumId={applicantMatchingDatum.id}
                        key={i}
                    />
                </React.Fragment>
            );
        });
    }

    const disabled = selectedApplicantMatchingDatumIds.length === 0;

    return (
        <React.Fragment>
            <ActionButton
                icon={FaSearchDollar}
                onClick={() => setDialogVisible(true)}
                title={
                    disabled
                        ? "You must select an appointment to view its details"
                        : "View details of selected appointment(s)"
                }
                disabled={disabled}
            >
                Appointment Details
            </ActionButton>
            <Modal
                show={dialogVisible}
                onHide={() => setDialogVisible(false)}
                size="xl"
            >
                <Modal.Header closeButton>
                    <Modal.Title>Appointment Details</Modal.Title>
                </Modal.Header>
                <Modal.Body>{applicantMatchingDatumDetails}</Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="light"
                        onClick={() => setDialogVisible(false)}
                    >
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </React.Fragment>
    );
}
