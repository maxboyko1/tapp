import React from "react";
import { IconButton } from "@mui/material";
import StickyNote2Icon from "@mui/icons-material/StickyNote2";

import { ApplicantSummary } from "../../../types";
import { ApplicantNoteDialog } from "../../../match-actions";

/**
 * A button that displays a dialog allowing one to edit an applicant's notes.
 */
export function ApplicantNote({
    applicantSummary,
}: {
    applicantSummary: ApplicantSummary;
}) {
    const [showApplicantNote, setShowApplicantNote] = React.useState(false);
    const hasNote =
        applicantSummary.applicantMatchingDatum.note &&
        applicantSummary.applicantMatchingDatum.note.length > 0;

    return (
        <>
            <IconButton
                title="View or edit this applicant's note"
                className={`applicant-icon ${hasNote ? "active" : "inactive"}`}
                onClick={() => setShowApplicantNote(true)}
                size="small"
            >
                <StickyNote2Icon />
            </IconButton>
            <ApplicantNoteDialog
                applicantSummary={applicantSummary}
                show={showApplicantNote}
                setShow={setShowApplicantNote}
            />
        </>
    );
}
