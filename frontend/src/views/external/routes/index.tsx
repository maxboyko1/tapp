import React from "react";
import { Route, Routes } from "react-router-dom";

// Lazy-load the individual views to reduce bundle size and improve performance
const ContractView = React.lazy(() => import("../contracts"));
const LetterView = React.lazy(() => import("../letters"));
const DdahView = React.lazy(() => import("../ddahs"));
const PostingView = React.lazy(() => import("../postings"));

export function ExternalRoutes() {
    return (
        <React.Suspense fallback={<div>Loading...</div>}>
            <Routes>
                <Route path="/external/contracts/:url_token" element={
                    <ContractView />
                }/>
                <Route path="/external/letters/:url_token" element={
                    <LetterView />
                }/>
                <Route path="/external/ddahs/:url_token" element={
                    <DdahView />
                }/>
                <Route path="/external/postings/:url_token" element={
                    <PostingView />
                }/>
            </Routes>
        </React.Suspense>
    );
}
