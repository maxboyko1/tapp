import React, { Suspense } from "react";
import { useMatch } from "react-router-dom";

const MainEntry = React.lazy(() => import("./main-entry"));
const ExternalEntry = React.lazy(() => import("./external-entry"));

/**
 * Dynamically load the correct entry component based on the route string.
 *
 * @export
 * @returns
 */
export default function DynamicEntryRouter() {
    const match = useMatch("/external/*");
    const content = match ? <ExternalEntry /> : <MainEntry />;

    return (
        <React.Fragment>
            <Suspense fallback="Loading...">{content}</Suspense>
        </React.Fragment>
    );
}
