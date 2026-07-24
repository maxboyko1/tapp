import React from "react";
import MarkEmailUnreadIcon from "@mui/icons-material/MarkEmailUnread";

import { emailPosition } from "../../../api/actions/positions";
import { Position } from "../../../api/defs/types";
import { ActionButton } from "../../../components/action-buttons";
import { useThunkDispatch } from "../../../libs/thunk-dispatch";
import { PositionConfirmationDialog } from "./position-confirmation-dialog";

type ButtonWithDialogProps = {
    selectedPositions: Position[];
};

export function EmailPositionsButtonWithDialog({
    selectedPositions,
}: ButtonWithDialogProps) {
    const [showConfirmation, setShowConfirmation] = React.useState(false);
    const dispatch = useThunkDispatch();

    function emailPositions() {
        return Promise.all(
            selectedPositions.map((position) => dispatch(emailPosition(position)))
        );
    }

    function confirm() {
        if (selectedPositions?.length > 1) {
            setShowConfirmation(true);
        } else {
            emailPositions();
        }
    }

    return (
        <React.Fragment>
            <ActionButton
                icon={<MarkEmailUnreadIcon />}
                onClick={confirm}
                disabled={selectedPositions.length === 0}
                title={"Email DDAH reminders to instructors for selected positions"}
            >
                Email DDAH
            </ActionButton>
            <PositionConfirmationDialog
                selectedPositions={selectedPositions}
                visible={showConfirmation}
                setVisible={setShowConfirmation}
                callback={emailPositions}
                title="Emailing DDAH Reminders for Multiple Positions"
                body={`Emailing DDAH reminders for the following ${selectedPositions.length} positions.`}
                confirmation={`Email DDAH Reminders for ${selectedPositions.length} Positions`}
            />
        </React.Fragment>
    );
}
