import { Navigate, Route, Routes } from "react-router-dom";
import { AdminInstructorsView } from "../instructors";
import { AdminSessionsView } from "../sessions";
import { AdminPositionsView } from "../positions";
import { AdminAssignmentsView } from "../assignments";
import { AdminContractTemplatesView } from "../contract_template";
import { Landing } from "../admin-header/landing";
import { AdminApplicantsView } from "../applicants";
import { AdminDdahsView } from "../ddahs";
import { PostingOverview } from "../postings/overview";
import { PostingDetails } from "../postings/posting-details";
import { PostingPreview } from "../postings/posting-preview";
import { AdminApplicationsView } from "../applications";
import { AdminMatchingView } from "../matching";
import { AdminAppointmentsView } from "../guarantees";

export function AdminRoutes() {
    return (
        <Routes>
            <Route path="/" element={
                <Navigate to="/assignments_and_positions/assignments" />
            }/>
            <Route path="/tapp" element={
                <Landing />
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
                <PostingOverview />
            }/>
            <Route path="/postings/:posting_id/details" element={
                <PostingDetails />
            }/>
            <Route path="/postings/:posting_id/preview" element={
                <PostingPreview />
            }/>
        </Routes>
    );
}
