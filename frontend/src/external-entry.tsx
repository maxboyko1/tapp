import React from "react";
import { ExternalRoutes } from "./views/external/routes";
import "./external-entry.css";

/**
 * This is the entry point for public routes. Most components are not loaded
 * in this route.
 *
 * @export
 * @returns
 */
export default function ConnectedApp() {
    return <ExternalRoutes />;
}
