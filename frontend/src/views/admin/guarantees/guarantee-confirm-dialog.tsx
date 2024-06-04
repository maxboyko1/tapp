import React from "react";
import { AdvancedFilterTable } from "../../../components/filter-table/advanced-filter-table";
import { Button, Modal, Spinner } from "react-bootstrap";
import { ApplicantMatchingDatum } from "../../../api/defs/types";
import { compareString } from "../../../libs/utils";

const applicantMatchingDatumModalColumn = [
    {
        Header: "Last Name",
        accessor: "applicant.last_name",
        maxWidth: 120,
    },
    {
        Header: "First Name",
        accessor: "applicant.first_name",
        maxWidth: 120,
    },
    {
        Header: "Minimum Hours Owed",
        accessor: "min_hours_owed",
        className: "number-cell",
        maxWidth: 70,
    },
    {
        Header: "Maximum Hours Owed",
        accessor: "max_hours_owed",
        className: "number-cell",
        maxWidth: 70,
    },
    {
        Header: "Hours Previously Fulfilled",
        accessor: "prev_hours_fulfilled",
        className: "number-cell",
        maxWidth: 70,
    },
    {
        Header: "Status",
        maxWidth: 100,
        id: "status",
        // We want items with no active confirmation to appear at the end of the list
        // when sorted, so we set their accessor to null (the accessor is used by react table
        // when sorting items).
        accessor: (data: { active_confirmation_status: string }) =>
            data.active_confirmation_status === "No Letter Sent"
                ? null
                : data.active_confirmation_status,
    },
];

function compareAppointment(a1: ApplicantMatchingDatum, a2: ApplicantMatchingDatum) {
    return (
        compareString(a1.applicant.last_name || "", a2.applicant.last_name || "") ||
        compareString(a1.applicant.first_name, a2.applicant.first_name)
    );
}

export function GuaranteeConfirmDialog(props: {
    data: ApplicantMatchingDatum[];
    visible: boolean;
    setVisible: Function;
    callback: Function;
    title: string;
    body: string;
    confirm: string;
}) {
    const { data, visible, setVisible, callback, title, body, confirm } =
        props;

    const [inProgress, setInProgress] = React.useState(false);

    async function executeCallback() {
        setInProgress(true);
        await callback();
        setInProgress(false);
        setVisible(false);
    }

    // When a confirm operation is in progress, a spinner is displayed; otherwise
    // it's hidden
    const spinner = inProgress ? (
        <Spinner animation="border" size="sm" className="mr-1" />
    ) : null;

    // We want to minimize the re-render of the table. Since some bindings for columns
    // are generated on-the-fly, memoize the result so we don't trigger unneeded re-renders.
    data.sort(compareAppointment);

    return (
        <Modal
            show={visible}
            onHide={() => {
                setVisible(false);
            }}
            size="lg"
        >
            <Modal.Header closeButton>
                <Modal.Title>{title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="mb-3 alert alert-info" role="alert">
                    {body}
                </div>
                <div className="mb-3">
                    <AdvancedFilterTable
                        filterable={false}
                        columns={applicantMatchingDatumModalColumn}
                        data={data}
                    />
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button
                    onClick={() => {
                        setVisible(false);
                    }}
                    variant="light"
                >
                    Cancel
                </Button>
                <Button onClick={executeCallback}>
                    {spinner}
                    {confirm}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
