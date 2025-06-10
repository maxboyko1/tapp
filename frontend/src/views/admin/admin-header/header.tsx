import React from "react";
import { useMatch } from "react-router-dom";
import { Header } from "../../../components/header";
import {
    ConnectedActiveSessionDisplay,
    ConnectedActiveUserDisplay,
} from "../../common/header-components";

export const ROUTES = [
    {
        route: "/session_setup",
        name: "Session Setup",
        description: "Setup a new session or manage an existing session.",
        subroutes: [
            {
                route: "/sessions",
                name: "Sessions",
                description: "Manage Sessions",
            },
            {
                route: "/contract_templates",
                name: "Contract Templates",
                description: "Manage Contract Templates",
            },
            {
                route: "/instructors",
                name: "Instructors",
                description: "Manage Instructors",
            },
        ],
    },

    {
        route: "/assignments_and_positions",
        name: "Assignments & Positions",
        description: "Manage Assignments & Positions",
        subroutes: [
            {
                route: "/positions",
                name: "Positions",
                description: "Manage Positions",
            },
            {
                route: "/assignments",
                name: "Assignments",
                description: "Manage Assignments",
            },
            {
                route: "/ddahs",
                name: "DDAHs",
                description: "Manage DDAHs",
            },
        ],
    },
    {
        route: "/applicants_and_applications",
        name: "Applicants & Applications",
        description: "Manage applicants and applications",
        subroutes: [
            {
                route: "/applicants",
                name: "Applicants",
                description: "Manage Applicants",
            },
            {
                route: "/applications",
                name: "Applications",
                description: "Manage Applications",
            },
            {
                route: "/appointments",
                name: "Subsequent Appointments",
                description: "Manage subsequent appointment guarantees",
            },
        ],
    },
    {
        route: "/matching",
        name: "Matching",
        description: "Match applications to positions",
        subroutes: [
            {
                route: "/matching",
                name: "Matching",
                description: "Match applicants to positions",
            },
        ],
    },
];

const POSTINGS_ROUTES = {
    route: "/postings",
    name: "Job Postings",
    description: "Manage and create job postings",
    subroutes: [
        {
            route: "/overview",
            name: "Overview",
            description: "Manage Job Postings",
        },
    ],
};

/**
 * Header showing the routes that a user with `role=admin`
 * can see.
 *
 * @returns
 */

function AdminHeader() {
    const match = useMatch("/postings/:posting_id/*");
    const routes = [...ROUTES];

    // There are routes that are visible only when viewing a posting;
    // Dynamically insert those.
    if (
        match &&
        match.params?.posting_id &&
        !isNaN(parseInt("" + match.params.posting_id))
    ) {
        const posting_id = match.params.posting_id;
        const postingRoutes = { ...POSTINGS_ROUTES };
        postingRoutes.subroutes = [
            ...postingRoutes.subroutes,
            {
                route: `/${posting_id}/details`,
                name: "Details",
                description: "Edit/View Details of a Job Postings",
            },
            {
                route: `/${posting_id}/preview`,
                name: "Preview",
                description: "Preview a Job Postings",
            },
        ];
        routes.push(postingRoutes);
    } else {
        routes.push(POSTINGS_ROUTES);
    }

    return (
        <Header
            routes={routes}
            infoComponents={[
                <ConnectedActiveSessionDisplay key={0} />,
                <ConnectedActiveUserDisplay key={1} />,
            ]}
        />
    );
}

export { AdminHeader };
