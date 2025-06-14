import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { initFromStage, activeRoleSelector } from "./api/actions";
import { ConnectedNotifications } from "./views/common/notifications";
import { AdminRoutes } from "./views/admin/routes";
import { InstructorRoutes } from "./views/instructor/routes";
import { AdminHeader } from "./views/admin/admin-header";

import "./main-entry.css";
import { InstructorHeader } from "./views/instructor";
import { useThunkDispatch } from "./libs/thunk-dispatch";

/**
 * This is the entry point for full app for admins/instructors/tas
 *
 * @export
 * @returns
 */
export default function ConnectedApp() {
    const activeRole = useSelector(activeRoleSelector);
    const dispatch = useThunkDispatch();

    useEffect(() => {
        // When the page is first loaded, we need to fetch all the data
        // associated with the page. This is done via a call to `initFromStage`.
        (async () => {
            try {
                await dispatch(initFromStage("pageLoad"));
            } catch (e: any) {
                console.log(e);
            }
        })();
    }, [dispatch]);

    let body = <div>Loading...</div>;

    if (activeRole === "admin") {
        body = (
            <>
                <AdminHeader />
                <div className="view-container">
                    <AdminRoutes />
                </div>
            </>
        );
    }

    if (activeRole === "instructor") {
        body = (
            <>
                <InstructorHeader />
                <div className="view-container">
                    <InstructorRoutes />
                </div>
            </>
        );
    }
    if (activeRole === "ta") {
        body = <div>&quot;Viewing as TA&quot;</div>;
    }

    return (
        <div id="app-body">
            <React.Fragment>
                {body}
                <ConnectedNotifications />
            </React.Fragment>
        </div>
    );
}
