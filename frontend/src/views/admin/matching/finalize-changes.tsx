import React from "react";
import { matchesSelector, assignmentsSelector } from "../../../api/actions";
import { useSelector } from "react-redux";
import { Modal, Button, Alert } from "react-bootstrap";
import { useThunkDispatch } from "../../../libs/thunk-dispatch";
import { AdvancedFilterTable } from "../../../components/filter-table/advanced-filter-table";
import { upsertAssignment } from "../../../api/actions";

const DEFAULT_COLUMNS = [
    { Header: "Position Code", accessor: "position.position_code" },
    { Header: "Hours", accessor: "hours_assigned" },
    { Header: "Last Name", accessor: "applicant.last_name" },
    { Header: "First Name", accessor: "applicant.first_name" },
    { Header: "UTORid", accessor: "applicant.utorid" },
];

/**
 * A button that brings up a modal allowing users to see a list of staged assignments
 * and transform them into real assignments.
 */
export function FinalizeChangesButton() {
    const [dialogVisible, setDialogVisible] = React.useState(false);

    const matches = useSelector(matchesSelector);
    const assignments = useSelector(assignmentsSelector);
    const dispatch = useThunkDispatch();
    const stagedAssignments = React.useMemo(() => {
        return matches.filter((match) => {
            return (
                match.assigned &&
                !assignments.find(
                    (assignment) =>
                        assignment.applicant.id === match.applicant.id &&
                        assignment.position.id === match.position.id
                )
            );
        });
    }, [matches, assignments]);

    async function finalizeAssignments() {
        const assignmentPromises = stagedAssignments.map((match) => {
            return dispatch(
                upsertAssignment({
                    position: match.position,
                    applicant: match.applicant,
                    hours: match.hours_assigned || 0,
                })
            );
        });

        await Promise.all(assignmentPromises);
    }

    function _onConfirm() {
        if (stagedAssignments.length === 0) {
            setDialogVisible(false);
            return;
        }

        finalizeAssignments().then((r) => setDialogVisible(false));
    }

    return (
        <>
            <Button
                variant="outline-primary"
                size="sm"
                className="footer-button finalize"
                onClick={() => setDialogVisible(true)}
                disabled={stagedAssignments.length === 0}
            >
                Finalize Changes
                {stagedAssignments.length > 0
                    ? ` (${stagedAssignments.length})`
                    : ""}
            </Button>
            <Modal
                show={dialogVisible}
                dialogClassName="finalize-changes-modal"
                onHide={() => setDialogVisible(false)}
                size="lg"
            >
                <Modal.Header>
                    <Modal.Title>Finalize Changes</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Alert variant="info">
                        The following assignments will be made.
                    </Alert>
                    <AdvancedFilterTable
                        columns={DEFAULT_COLUMNS}
                        data={stagedAssignments}
                        filterable={true}
                    />
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        onClick={() => setDialogVisible(false)}
                        variant="light"
                    >
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={_onConfirm}>
                        Confirm
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}
