import React from "react";
import { Route, Routes } from "react-router-dom";

// Lazy-load the individual views to optimize performance
const ContractView = React.lazy(() => import("../contracts"));
const LetterView = React.lazy(() => import("../letters"));
const DdahView = React.lazy(() => import("../ddahs"));
const PostingView = React.lazy(() => import("../postings"));

export function PublicRoutes() {
    return (
        <React.Suspense fallback={<div>Loading...</div>}>
            <Routes>
                <Route path="/public/contracts/:url_token" element={
                    <ContractView />
                }/>
                <Route path="/public/letters/:url_token" element={
                    <LetterView />
                }/>
                <Route path="/public/ddahs/:url_token" element={
                    <DdahView />
                }/>
                <Route path="/public/postings/:url_token" element={
                    <PostingView />
                }/>
            </Routes>
        </React.Suspense>
    );
}
