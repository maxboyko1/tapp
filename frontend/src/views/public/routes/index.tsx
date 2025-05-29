import { Route, Routes } from "react-router-dom";

import { ContractView } from "../contracts";
import { LetterView } from "../letters";
import { DdahView } from "../ddahs";
import { PostingView } from "../postings";

export function PublicRoutes() {
    return (
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
    );
}
