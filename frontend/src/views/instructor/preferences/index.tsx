import React from "react";
import { Typography } from "@mui/material";
import CommentIcon from "@mui/icons-material/Comment";

import { ActionsList, ActionHeader } from "../../../components/action-buttons";
import { ContentArea } from "../../../components/layout";
import { InstructorApplicationsTable } from "./applications-table";
import { useSelector } from "react-redux";
import { activePositionSelector } from "../store/actions";
import {
    activeSessionSelector,
} from "../../../api/actions";
import { formatDate } from "../../../libs/utils";
import { DisplayRating } from "../../../components/applicant-rating";
import { ConnectedExportApplicationsAction } from "./import-export";

export default function InstructorPreferencesView() {
    const activeSession = useSelector(activeSessionSelector);
    const activePosition = useSelector(activePositionSelector);

    if (!activeSession || !activePosition) {
        return (
            <h4>Please select a Session and Position to see TA information</h4>
        );
    }

    const formattedPositionName = `${activePosition.position_code} ${
        activePosition.position_title
            ? ` (${activePosition.position_title})`
            : ""
    }`;
    const formattedSessionName = `${activeSession.name} (${formatDate(
        activeSession.start_date
    )} to ${formatDate(activeSession.end_date)})`;

    return (
        <div className="page-body">
            <ActionsList>
                <ActionHeader>Actions</ActionHeader>
                <ConnectedExportApplicationsAction />
            </ActionsList>
            <ContentArea>
                <Typography variant="h4" gutterBottom>
                    <span>{formattedPositionName}</span>
                </Typography>
                <Typography>
                    Below is a list of your TAs who have applied for{" "}
                    <Typography component="span" color="primary" display="inline" sx={{ fontWeight: "bold" }}>
                        {formattedPositionName}
                    </Typography>{" "}
                    for the{" "}
                    <Typography component="span" color="primary" display="inline" sx={{ fontWeight: "bold" }}>
                        {formattedSessionName}
                    </Typography>{" session. "}
                    You may review a TA&apos;s application and indicate
                    which TAs would be most suitable for your course.
                </Typography>
                <Typography>
                    Please indicate whether a TA is <b>suitable</b> (<DisplayRating rating={1} />) for the course,{" "}
                    <b>strongly preferred</b> (<DisplayRating rating={2} />), or <b>not suitable</b> (<DisplayRating rating={-1} />).
                    Additionally, you may leave a comment by clicking the <CommentIcon /> icon. If you don&apos;t have enough information
                    to rate the applicant, leave the rating blank or <b>unknown</b> (<DisplayRating rating={0} />).
                </Typography>
                <Typography sx={{ mt: 1, mb: 2 }}>
                    Please note that while your preferences will be taken into account to the best of the TA Coordinator&apos;s ability, there
                    are many constraints when assigning TAs and the final TA assignments may not match your preferences.
                </Typography>
                <InstructorApplicationsTable />
            </ContentArea>
        </div>
    );
}
