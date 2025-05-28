import React, { Suspense } from "react";
import { useMatch } from "react-router-dom";

const MainEntry = React.lazy(() => import("./main-entry"));
const PublicEntry = React.lazy(() => import("./public-entry"));

/**
 * Dynamically load the correct entry component based on the route string.
 *
 * @export
 * @returns
 */
export default function DynamicEntryRouter() {
    const match = useMatch("/public/*");
    const content = match ? <PublicEntry /> : <MainEntry />;

    return (
        <React.Fragment>
            <Suspense fallback="Loading...">{content}</Suspense>
        </React.Fragment>
    );
}
