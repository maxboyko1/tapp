import React from "react";
import { useSelector } from "react-redux";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    List,
    ListItem,
    ListItemButton,
    Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Link } from "react-router-dom";

import { ContentArea } from "../../../components/layout";
import { formatDate } from "../../../libs/utils";
import {
    activeSessionSelector,
    activeUserSelector,
    positionsSelector,
    sessionsSelector,
    setActiveSession,
} from "../../../api/actions";
import { useThunkDispatch } from "../../../libs/thunk-dispatch";

export function InstructorSessionsView() {
    const activeSession = useSelector(activeSessionSelector);
    const sessions = useSelector(sessionsSelector);
    const dispatch = useThunkDispatch();

    const allPositions = useSelector(positionsSelector);
    const activeUser = useSelector(activeUserSelector);

    const positions = React.useMemo(() => {
        return allPositions.filter((position) =>
            position.instructors.find(
                (instructor) =>
                    "utorid" in activeUser &&
                    instructor.utorid === activeUser.utorid
            )
        );
    }, [allPositions, activeUser]);

    let heading = (
        <Typography variant="h4" color="text.primary">
            No session is currently selected
        </Typography>
    );
    if (activeSession) {
        heading = (
            <Typography variant="h4">
                The currently active session is{" "}
                <Typography component="span" color="primary" display="inline">
                    {activeSession.name} ({formatDate(activeSession.start_date)} to {formatDate(activeSession.end_date)})
                </Typography>
            </Typography>
        );
    }

    return (
        <div className="page-body">
            <ContentArea>
                {heading}
                <Typography component="p">
                    Below is a list of all sessions where you are listed as an
                    instructor. Select a session to see <i>positions</i>{" "}
                    (courses) that you are/were an instructor for.
                </Typography>
                {sessions.length === 0 ? (
                    <Typography variant="h4">
                        You are not listed as an instructor for any session
                    </Typography>
                ) : null}
                {sessions.map((session) => {
                    const isActive = session.id === activeSession?.id;
                    const sessionPositions = positions.filter(
                        (position) => position.session_id === session.id
                    );
                    return (
                        <Accordion key={session.id} expanded={isActive} onChange={() => dispatch(setActiveSession(session))}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography variant="h6" color={isActive ? "primary" : "textPrimary"}>
                                    {session.name} ({formatDate(session.start_date)} to {formatDate(session.end_date)})
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <List>
                                    {sessionPositions.length > 0 ? (
                                        sessionPositions.map((position) => (
                                            <ListItem key={position.id} disablePadding>
                                                <ListItemButton component={Link} to={`/instructor/positions/${position.id}`}>
                                                    <Typography>
                                                        {position.position_code}
                                                        {position.position_title ? ` (${position.position_title})` : ""}
                                                    </Typography>
                                                </ListItemButton>
                                            </ListItem>
                                        ))
                                    ) : (
                                        <ListItem>
                                            <Typography>No Positions</Typography>
                                        </ListItem>
                                    )}
                                </List>
                            </AccordionDetails>
                        </Accordion>
                    )
                })}
            </ContentArea>
        </div>
    );
}
