import React from "react";
import PropTypes from "prop-types";
import { NavLink, NavLinkProps, useLocation } from "react-router-dom";
import {
    Box,
    Button,
} from "@mui/material";

import "./components.css";

/**
 * Wrap `"react-router-dom"`'s `NavLink` in Material UI
 * styling.
 */
function MaterialNavItem(
    props: React.PropsWithChildren<
        { to: string; className?: string; title?: string } & NavLinkProps
    >
) {
    return (
        <Button
            component={NavLink}
            to={props.to}
            color="inherit"
            size="small"
            sx={{
                textTransform: "none",
                minHeight: 0,
                minWidth: "unset",
                px: 1,
                py: 0.5,
                mx: 0.5,
                "&.primary": { fontWeight: "bold", fontSize: "1rem" },
                "&.secondary": { fontWeight: "normal", fontSize: "0.9rem" },
            }}
            title={props.title}
            className={props.className}
        >
            {props.children}
        </Button>
    );
}
MaterialNavItem.propTypes = {
    to: PropTypes.string,
    className: PropTypes.string,
    title: PropTypes.string,
};


/**
 * Render a header that dynamically adjusts depending on the route
 * (as determined by `react-router-dom`). Top-level routes appear in
 * a dropdown menu. Subroutes (which only show when the top-level route is active)
 * appear as a horizontal list. A top-level route takes the form
 *
 * ```
 * {
 *    route: "/some/route"
 *    name: "Display Name"
 *    description: "Alt Text"
 *    subroutes: [<same as routes>]
 * }
 * ```
 *
 * `subroutes.route` is automatically prefixed with the parent's `route`.
 */

export function Header(props: {
    routes: {
        route: string;
        name: string;
        description?: string;
        subroutes: {
            route: string;
            name: string;
            description?: string;
        }[];
    }[];
    infoComponents: React.ReactNode[];
}) {
    const { routes = [], infoComponents = [] } = props;
    const fullRoute = useLocation().pathname;

    if (routes.length === 0) {
        return <div>No Routes in Header</div>;
    }

    const activeMainRoutes = routes.map((route) => (
        <MaterialNavItem
            title={route.description}
            to={route.route}
            key={route.route}
            className="primary"
        >
            {route.name}
        </MaterialNavItem>
    ));

    // filters the routes to include only the current route, then maps all of that route's subroutes to MaterialNavItems
    const availableSubroutes = routes
        .filter(
            (route) =>
                fullRoute === route.route ||
                fullRoute.startsWith(route.route + "/")
        )
        .map((route) =>
            (route.subroutes || []).map((subroute) => {
                const fullroute = `${route.route}${subroute.route}`;
                return (
                    <MaterialNavItem
                        to={fullroute}
                        title={subroute.description}
                        key={fullroute}
                        className="secondary"
                    >
                        {subroute.name}
                    </MaterialNavItem>
                );
            })
        );

    return (
        <Box
            className="header-container"
            sx={{
                bgcolor: "primary.main",
                color: "primary.contrastText",
                px: 1,
                py: 0.5,
                display: "flex",
                flexDirection: "row",
                alignItems: "stretch",
                position: "relative",
            }}
        >
            <Box className="header-nav" sx={{ flexGrow: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 0.5 }}>
                <Box
                    className="primary-nav-links"
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        overflowX: "auto",
                        whiteSpace: "nowrap",
                        minHeight: "2.5rem",
                    }}
                >
                    {activeMainRoutes}
                </Box>
                {availableSubroutes.length > 0 && (
                    <Box
                        className="secondary-nav-links"
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                            overflowX: "auto",
                            whiteSpace: "nowrap",
                            minHeight: "2.2rem",
                        }}
                    >
                        {availableSubroutes}
                    </Box>
                )}
            </Box>
            <Box
                className="header-widgets"
                sx={{
                    ml: "auto",
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    flexShrink: 0,
                    position: "relative",
                }}
            >
                {infoComponents}
            </Box>
        </Box>
    );
}
