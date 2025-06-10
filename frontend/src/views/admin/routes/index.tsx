import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";

// Lazy-load the individual views to reduce bundle size and improve performance
const AdminApplicantsView = React.lazy(() => import("../applicants"));
const AdminApplicationsView = React.lazy(() => import("../applications"));
const AdminAppointmentsView = React.lazy(() => import("../guarantees"));
const AdminAssignmentsView = React.lazy(() => import("../assignments"));
const AdminContractTemplatesView = React.lazy(() => import("../contract_template"));
const AdminDdahsView = React.lazy(() => import("../ddahs"));
const AdminInstructorsView = React.lazy(() => import("../instructors"));
const AdminMatchingView = React.lazy(() => import("../matching"));
const AdminPositionsView = React.lazy(() => import("../positions"));
const AdminSessionsView = React.lazy(() => import("../sessions"));
const ConnectedLandingView = React.lazy(() => import("../admin-header/landing"));
const ConnectedPostingDetails = React.lazy(() => import("../postings/posting-details"));
const ConnectedPostingOverview = React.lazy(() => import("../postings/overview"));
const ConnectedPostingPreview = React.lazy(() => import("../postings/posting-preview"));

export function AdminRoutes() {
    return (
        <React.Suspense fallback={<div>Loading...</div>}>
            <Routes>
                <Route path="/" element={
                    <Navigate to="/assignments_and_positions/assignments" />
                }/>
                <Route path="/tapp" element={
                    <ConnectedLandingView />
                }/>
                <Route path="/session_setup" element={
                    <Navigate to="/session_setup/sessions" />
                }/>
                <Route path="/session_setup/sessions" element={
                    <AdminSessionsView />
                }/>
                <Route path="/session_setup/contract_templates" element={
                    <AdminContractTemplatesView />
                }/>
                <Route path="/session_setup/instructors" element={
                    <AdminInstructorsView />
                }/>
                <Route path="/assignments_and_positions" element={
                    <Navigate to="/assignments_and_positions/assignments" />
                }/>
                <Route path="/assignments_and_positions/positions" element={
                    <AdminPositionsView />
                }/>
                <Route path="/assignments_and_positions/assignments" element={
                    <AdminAssignmentsView />
                }/>
                <Route path="/assignments_and_positions/ddahs" element={
                    <AdminDdahsView />
                }/>
                <Route path="/applicants_and_applications" element={
                    <Navigate to="/applicants_and_applications/applicants" />
                }/>
                <Route path="/applicants_and_applications/applicants" element={
                    <AdminApplicantsView />
                }/>
                <Route path="/applicants_and_applications/applications" element={
                    <AdminApplicationsView />
                }/>
                <Route path="/applicants_and_applications/appointments" element={
                    <AdminAppointmentsView />
                }/>
                <Route path="/matching" element={
                    <Navigate to="/matching/matching" />
                }/>
                <Route path="/matching/matching" element={
                    <AdminMatchingView />
                }/>
                <Route path="/postings" element={
                    <Navigate to="/postings/overview" />
                }/>
                <Route path="/postings/overview" element={
                    <ConnectedPostingOverview />
                }/>
                <Route path="/postings/:posting_id/details" element={
                    <ConnectedPostingDetails />
                }/>
                <Route path="/postings/:posting_id/preview" element={
                    <ConnectedPostingPreview />
                }/>
            </Routes>
        </React.Suspense>
    );
}
