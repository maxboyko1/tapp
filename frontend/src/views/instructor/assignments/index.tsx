import { useSelector } from "react-redux";
import { Typography } from "@mui/material";
import { ActionsList, ActionHeader } from "../../../components/action-buttons";
import { ContentArea } from "../../../components/layout";
import { InstructorAssignmentsTable } from "./assignments-table";
import { activePositionSelector } from "../store/actions";
import { activeSessionSelector } from "../../../api/actions";
import { formatDate } from "../../../libs/utils";
import { ConnectedExportAssignmentsAction } from "./import-export";

export function InstructorAssignmentsView() {
    const activeSession = useSelector(activeSessionSelector);
    const activePosition = useSelector(activePositionSelector);

    if (!activeSession || !activePosition) {
        return (
            <Typography variant="h4" color="text.primary">
                Please select a Session and Position to see TA information
            </Typography>
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
                <ConnectedExportAssignmentsAction />
            </ActionsList>
            <ContentArea>
                <Typography variant="h4" color="text.primary" gutterBottom>
                    {formattedPositionName}
                </Typography>
                <Typography component="p">
                    Below is a list of your TAs for{" "}
                    <Typography component="span" color="primary" display="inline">
                        {formattedPositionName}
                    </Typography>{" "}
                    for the{" "}
                    <Typography component="span" color="primary" display="inline">
                        {formattedSessionName}
                    </Typography>{" "}
                    session. TAs will only show up in this list if they have
                    been emailed an offer (status <i>pending</i>) or if they
                    have accepted an offer (status <i>accepted</i>). TAs who
                    have rejected an offer or had their offer withdrawn will now
                    show up.
                </Typography>
                <InstructorAssignmentsTable />
            </ContentArea>
        </div>
    );
}
