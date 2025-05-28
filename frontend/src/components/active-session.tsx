import React from "react";
import PropTypes from "prop-types";
import { Badge, Button, Typography } from "@mui/material";
import { FilterableMenu } from "./filterable-menu";
import { apiPropTypes } from "../api/defs/prop-types";
import { HasId, Session } from "../api/defs/types";

export function ActiveSessionDisplay(props: {
    sessions: Session[];
    activeSession: Session | null;
    setActiveSession: (session: Session | null) => void;
}) {
    const { sessions = [], activeSession, setActiveSession } = props;
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

    const activeSessionId = activeSession ? activeSession.id : null;

    let label = (
        <Typography color="inherit" sx={{ mr: 0.5 }} component="span">
            Select a Session
        </Typography>
    );
    if (activeSession != null) {
        label = (
            <Typography color="inherit" sx={{ mr: 0.5 }} component="span">
                {activeSession.name}
            </Typography>
        );
    }

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleSelect = (session: Session, _index: number) => {
        setActiveSession(session);
        handleMenuClose();
    };

    return (
        <Badge
            color="primary"
            badgeContent=""
            sx={{ ".MuiBadge-badge": { display: "none" } }}
        >
            <span>
                <Typography variant="body2" color="inherit" sx={{ mb: 0.5, display: "block", textAlign: "center" }}>
                    Selected session:
                </Typography>
                <Button
                    color="secondary"
                    variant="contained"
                    onClick={handleMenuOpen}
                    sx={{ textTransform: "none", display: "block", mx: "auto" }}
                >
                    {label}
                </Button>
                <FilterableMenu
                    items={sessions as (HasId & { name: string })[]}
                    activeItemId={activeSessionId}
                    clearFilter={!Boolean(anchorEl)}
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                    onSelect={handleSelect as any}
                />
            </span>
        </Badge>
    );
}
ActiveSessionDisplay.propTypes = {
    setActiveSession: PropTypes.func.isRequired,
    sessions: PropTypes.arrayOf(apiPropTypes.session).isRequired,
    activeSession: apiPropTypes.session,
};
