import React from "react";
import { useSelector } from "react-redux";
import { Typography } from "@mui/material";
import { activeSessionSelector } from "../../../api/actions";
import { ConnectedActiveSessionDisplay } from "../../common/header-components";
import { ContentArea } from "../../../components/layout";
import { Session } from "../../../api/defs/types";

export default function ConnectedLandingView() {
    const activeSession = useSelector(activeSessionSelector) as Session | null;

    let activeSessionInfo = (
        <Typography component="span">
            There is currently{" "}
            <Typography component="span" color="primary" fontWeight="bold" display="inline">
                no active session
            </Typography>{" "}
            selected. Please select one below.
        </Typography>
    );
    if (activeSession) {
        activeSessionInfo = (
            <Typography component="span">
                The current active session is{" "}
                <Typography component="span" color="primary" fontWeight="bold" display="inline">
                    {activeSession.name}
                </Typography>
                . You may select a different session below.
            </Typography>
        );
    }

    return (
        <div className="page-body">
            <ContentArea>
                <Typography variant="h2" gutterBottom>
                    Welcome to TAPP!
                </Typography>
                <Typography component="p">
                    TAPP is a TA administration program designed for creating
                    and distributing TA contracts.
                </Typography>
                <Typography component="p">
                    In order to use most features of TAPP, you need to select a{" "}
                    <i>session</i>. {activeSessionInfo}
                </Typography>
                <ConnectedActiveSessionDisplay />
            </ContentArea>
        </div>
    );
}
