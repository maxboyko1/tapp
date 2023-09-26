import React from "react";
import { Modal, Button } from "react-bootstrap";
import { upsertMatch } from "../../../../api/actions";
import { useThunkDispatch } from "../../../../libs/thunk-dispatch";
import { Position } from "../../../../api/defs/types";
import { ApplicantSummary } from "../types";
import { prepApplicantMatchForPosition } from "../utils";

/**
 * A modal window allowing users to change the number of hours an applicant
 * is assigned to a course.
 */
export function AdjustHourModal({
    applicantSummary,
    position,
    show,
    setShow,
}: {
    applicantSummary: ApplicantSummary;
    position: Position;
    show: boolean;
    setShow: (arg0: boolean) => void;
}) {
    const [hoursAssigned, setHoursAssigned] = React.useState("");
    const applicantMatch = React.useMemo(() => {
        return prepApplicantMatchForPosition(applicantSummary, position);
    }, [applicantSummary, position]);

    const dispatch = useThunkDispatch();
    return (
        <Modal show={show} onHide={() => setShow(false)} size="sm">
            <Modal.Header closeButton>
                <Modal.Title>Update Hours</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <input
                    className="form-control"
                    type="number"
                    defaultValue={applicantMatch.hours_assigned || 0}
                    onChange={(e) => setHoursAssigned(e.target.value)}
                />
            </Modal.Body>
            <Modal.Footer>
                <Button
                    onClick={() => setShow(false)}
                    variant="outline-secondary"
                >
                    Close
                </Button>
                <Button
                    disabled={hoursAssigned === ""}
                    onClick={() => {
                        dispatch(
                            upsertMatch({
                                ...applicantMatch,
                                hours_assigned: Number(hoursAssigned),
                            })
                        );
                        setShow(false);
                    }}
                    variant="outline-primary"
                >
                    Save
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
