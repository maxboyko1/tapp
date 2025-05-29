import { connect } from "react-redux";
import PropTypes from "prop-types";
import { NavLink, Routes, Route, useLocation } from "react-router-dom";
import {
    Alert,
    AppBar,
    Box,
    Tab,
    Tabs,
    Toolbar,
    Typography,
} from "@mui/material";
import { ErrorBoundary } from "react-error-boundary";
import { ApiReferenceReact } from "@scalar/api-reference-react";
import "@scalar/api-reference-react/style.css";

import { ToggleMockApi } from "./mockAPI";
import { mockApiRoutesAsSwaggerPaths } from "../../api/defs/doc-generation";
import { mockAPI } from "../../api/mockAPI";
import {
    setMockAPIState,
    usersSelector,
    activeUserSelector,
    debugOnlySetActiveUser,
    debugOnlyFetchUsers,
    sessionsSelector,
    fetchSessions,
} from "../../api/actions";
import { ActiveUserButton } from "./active-user-switch";
import { SeedDataMenu } from "./load-mock-data";

import "./main.css";

function MaterialUINavTab(props) {
    const location = useLocation();
    const selected = location.pathname === props.to;
    return (
        <Tab
            label={props.children}
            component={NavLink}
            to={props.to}
            value={props.to}
            sx={{
                color: selected ? "primary.main" : "inherit",
                fontWeight: selected ? "bold" : "normal",
            }}
        />
    );
}
MaterialUINavTab.propTypes = {
    to: PropTypes.string,
    children: PropTypes.node,
};

const swaggerData = {
    openapi: "3.0.0",
    info: {
        description:
            "TAPP is a program for TA management--for making TA assignments and distributing TA contracts.",
        title: "TAPP",
    },
    servers: [
        { url: "/api/v1/admin" },
        { url: "/api/v1/instructor" },
        { url: "/api/v1/ta" },
        { url: "/api/v1" },
        { url: "/" },
    ],
    paths: {
        ...mockApiRoutesAsSwaggerPaths(mockAPI),
    },
};

const ConnectedActiveUserButton = connect(
    (state) => ({
        activeUser: activeUserSelector(state),
        users: usersSelector(state),
    }),
    { fetchUsers: debugOnlyFetchUsers, setActiveUser: debugOnlySetActiveUser }
)(ActiveUserButton);

const ConnectedToggleMockApi = connect(null, { setMockAPIState })(
    ToggleMockApi
);

const ConnectedLoadMockButton = connect(
    (state) => ({ sessions: sessionsSelector(state) }),
    { fetchSessions }
)(SeedDataMenu);

function MaterialUIErrorFallback({ error }) {
    return (
        <Alert severity="error" sx={{ mt: 2 }}>
            There was an error when rendering. See console for details.<br />
            <Typography variant="body2" sx={{ mt: 1 }}>
                {error?.message}
            </Typography>
        </Alert>
    );
}

function DevFrame(props) {
    const location = useLocation();
    const tabValues = ["/api-docs"];
    const tab = tabValues.includes(location.pathname) ? location.pathname : false;

    return (
        <Box id="dev-frame" sx={{ minHeight: "100vh" }}>
            <AppBar position="static" color="info">
                <Toolbar>
                    <Typography variant="h4" sx={{ flexGrow: 0, mr: 2 }}>
                        Dev Mode
                    </Typography>
                    <Tabs
                        value={tab}
                        textColor="inherit"
                        indicatorColor="secondary"
                        sx={{ flexGrow: 1 }}
                    >
                        <MaterialUINavTab to="/api-docs">API Docs</MaterialUINavTab>
                    </Tabs>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <ConnectedLoadMockButton />
                        <ConnectedActiveUserButton />
                        <ConnectedToggleMockApi />
                    </Box>
                </Toolbar>
            </AppBar>
            <Routes>
                <Route
                    path="/api-docs"
                    element={
                        <ApiReferenceReact
                            configuration={{
                                spec: {
                                    content: swaggerData,
                                    format: "object",
                                },
                            }}
                        />
                    }
                />
                <Route
                    path="*"
                    element={
                        <ErrorBoundary
                            FallbackComponent={MaterialUIErrorFallback}
                            onError={console.error}
                        >
                            {props.children}
                        </ErrorBoundary>
                    }
                />
            </Routes>
        </Box>
    );
}

export { DevFrame };