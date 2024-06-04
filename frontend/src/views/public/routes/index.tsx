import React from "react";
import { Route, Switch } from "react-router-dom";
import { ContractView } from "../contracts";
import { LetterView } from "../letters";
import { DdahView } from "../ddahs";
import { PostingView } from "../postings";

export function PublicRoutes() {
    return (
        <Switch>
            <Route path="/public/contracts/:url_token">
                <ContractView />
            </Route>
            <Route path="/public/letters/:url_token">
                <LetterView />
            </Route>
            <Route path="/public/ddahs/:url_token">
                <DdahView />
            </Route>
            <Route path="/public/postings/:url_token">
                <PostingView />
            </Route>
        </Switch>
    );
}
