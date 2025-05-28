import React from "react";
import { Menu } from "@mui/material";

import { Position, Application } from "../../../../../../api/defs/types";
import { ApplicantSummary } from "../../../types";
import { GridItemDropdown } from "./dropdown";
import { ApplicantPillLeft } from "./status-bar";
import { ApplicantPillMiddle, ApplicantPillRight } from "./body";
import {
    ApplicantNoteDialog,
    AdjustHourModal,
    ApplicationDetailModal,
} from "../../../match-actions";

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

    // Material UI menu state
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    return (
        <>
            <ApplicantPill
                applicantSummary={applicantSummary}
                position={position}
                onClick={handleMenuOpen}
            />
            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleMenuClose}
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "left",
                }}
                transformOrigin={{
                    vertical: "top",
                    horizontal: "left",
                }}
                slotProps={{ list: { sx: { p: 0 } } }} // Remove default padding if needed
            >
                <div style={{ padding: 0 }}>
                    <GridItemDropdown
                        position={position}
                        applicantSummary={applicantSummary}
                        setShownApplication={setShownApplication}
                        setShowChangeHours={setShowChangeHours}
                        setShowNote={setShowApplicantNote}
                        onClose={handleMenuClose}
                    />
                </div>
            </Menu>
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
            <ApplicantNoteDialog
                applicantSummary={applicantSummary}
                show={showApplicantNote}
                setShow={setShowApplicantNote}
            />
        </>
    );
}
