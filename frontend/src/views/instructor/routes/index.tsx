import React from "react";
import { useSelector } from "react-redux";
import { Navigate, Route, Routes, useParams } from "react-router-dom";

import { activeSessionSelector } from "../../../api/actions";
import { setActivePositionId } from "../store/actions";
import { useThunkDispatch } from "../../../libs/thunk-dispatch";

// Lazy-load the individual views to reduce bundle size and improve performance
const InstructorAssignmentsView = React.lazy(() => import("../assignments"));
const InstructorDdahsView = React.lazy(() => import("../ddahs"));
const InstructorSessionsView = React.lazy(() => import("../sessions"));
const InstructorPreferencesView = React.lazy(() => import("../preferences"));

/**
 * Redirects to the appropriate view based on whether preferences are visible.
 * If preferences are visible, it redirects to the preferences view,
 * otherwise it redirects to the assignments view.
 */
function PositionRedirect({ showPreferences }: { showPreferences: boolean }) {
    const { position_id } = useParams<{ position_id: string }>();
    const to = showPreferences
        ? `/positions/${position_id}/preferences`
        : `/positions/${position_id}/assignments`;
    return <Navigate to={to} replace />;
}

/**
 * React component that will update the active position id in the
 * Redux store whenever it is rendered. This component is meant to be the first
 * component in a route that depends on an active position.
 */
function UpdateActivePosition() {
    const params = useParams<{ position_id?: string }>();
    const dispatch = useThunkDispatch();
    const rawPositionId = +(params.position_id || NaN);
    const position_id = Number.isFinite(rawPositionId) ? rawPositionId : null;
    React.useEffect(() => {
        dispatch(setActivePositionId(position_id));
    }, [position_id, dispatch]);
    return null;
}

export function InstructorRoutes() {
    const activeSession = useSelector(activeSessionSelector);
    const showPreferences =
        activeSession?.applications_visible_to_instructors || false;

    return (
        <React.Suspense fallback={<div>Loading...</div>}>
            <Routes>
                <Route path="/positions/:position_id/preferences" element={
                    activeSession?.applications_visible_to_instructors === false ? (
                        <Navigate to="/sessions/details" replace />
                    ) : (
                        <>
                            <UpdateActivePosition />
                            <InstructorPreferencesView />
                        </>
                    )
                }/>
                <Route path="/positions/:position_id/assignments" element={
                    <>
                        <UpdateActivePosition />
                        <InstructorAssignmentsView />
                    </>
                }/>
                <Route path="/positions/:position_id/ddahs" element={
                    <>
                        <UpdateActivePosition />
                        <InstructorDdahsView />
                    </>
                }/>
                <Route path="/sessions/details" element={
                    <InstructorSessionsView />
                }/>
                <Route
                    path="/positions/:position_id"
                    element={<PositionRedirect showPreferences={showPreferences} />}
                />
                <Route path="/sessions" element={
                    <Navigate to="/sessions/details" replace />
                }/>
                {/* Place this last so it only matches the root */}
                <Route path="/" element={
                    <Navigate to="/sessions/details" replace />
                }/>
            </Routes>
        </React.Suspense>
    );
}
