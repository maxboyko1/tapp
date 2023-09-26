import React from "react";
import { Position, Application } from "../../../../../../api/defs/types";
import { ApplicantSummary } from "../../../types";
import { GridItemDropdown } from "./dropdown";
import { ApplicantPillLeft } from "./status-bar";
import { ApplicantPillMiddle, ApplicantPillRight } from "./body";

import {
    ApplicantNoteModal,
    AdjustHourModal,
    ApplicationDetailModal,
} from "../../../match-actions";

import { Dropdown } from "react-bootstrap";
import DropdownToggle from "react-bootstrap/esm/DropdownToggle";
import DropdownMenu from "react-bootstrap/esm/DropdownMenu";

type CustomToggleProps = {
    children?: React.ReactNode;
    onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {};
};

/**
 * An applicant pill that displays a short summary of all data associated with a specific applicant.
 */
const ApplicantPill = React.forwardRef(function ApplicantPill(
    {
        applicantSummary,
        position,
        onClick,
    }: {
        applicantSummary: ApplicantSummary;
        position: Position;
        onClick: React.MouseEventHandler<HTMLButtonElement>;
    },
    ref: React.Ref<HTMLButtonElement>
) {
    return (
        <button ref={ref} className="applicant-pill" onClick={onClick}>
            <ApplicantPillLeft applicantSummary={applicantSummary} />
            <ApplicantPillMiddle
                applicantSummary={applicantSummary}
                position={position}
            />
            <ApplicantPillRight
                applicantSummary={applicantSummary}
                position={position}
            />
        </button>
    );
});

/**
 * A grid item to be displayed in grid view, showing a summary of an applicant.
 */
export function ConnectedApplicantPill({
    applicantSummary,
    position,
}: {
    applicantSummary: ApplicantSummary;
    position: Position;
}) {
    const [shownApplication, setShownApplication] =
        React.useState<Application | null>(null);
    const [showChangeHours, setShowChangeHours] = React.useState(false);
    const [showApplicantNote, setShowApplicantNote] = React.useState(false);
    const boundApplicantButton = React.useMemo(
        () =>
            React.forwardRef(
                (
                    props: CustomToggleProps,
                    ref: React.Ref<HTMLButtonElement>
                ) => (
                    <ApplicantPill
                        ref={ref}
                        onClick={(e) => {
                            e.preventDefault();
                            if (props.onClick) {
                                props.onClick(e);
                            }
                        }}
                        applicantSummary={applicantSummary}
                        position={position}
                    />
                )
            ),
        [applicantSummary, position]
    );

    return (
        <>
            <Dropdown>
                <DropdownToggle as={boundApplicantButton} />
                <DropdownMenu>
                    <GridItemDropdown
                        position={position}
                        applicantSummary={applicantSummary}
                        setShownApplication={setShownApplication}
                        setShowChangeHours={setShowChangeHours}
                        setShowNote={setShowApplicantNote}
                    />
                </DropdownMenu>
            </Dropdown>
            <ApplicationDetailModal
                application={shownApplication}
                setShownApplication={setShownApplication}
            />
            <AdjustHourModal
                position={position}
                applicantSummary={applicantSummary}
                show={showChangeHours}
                setShow={setShowChangeHours}
            />
            <ApplicantNoteModal
                applicantSummary={applicantSummary}
                show={showApplicantNote}
                setShow={setShowApplicantNote}
            />
        </>
    );
}
