import React from "react";
import { Alert, Paper } from "@mui/material";
import { Model } from "survey-core";
import { DoubleBorderLightPanelless } from "survey-core/themes";
import { Survey } from "survey-react-ui";

import { fetchSurvey } from "../../../../api/actions";
import { Posting } from "../../../../api/defs/types";
import { useThunkDispatch } from "../../../../libs/thunk-dispatch";

import "survey-core/survey-core.css";

export function ConnectedPostingPreviewView({ posting }: { posting: Posting }) {
    const dispatch = useThunkDispatch();
    const [jsonSurvey, setJsonSurvey] = React.useState<any>({});
    // We don't load postings by default, so we load them dynamically whenever
    // we view this page.
    React.useEffect(() => {
        async function fetchResources() {
            try {
                const json = await dispatch(fetchSurvey(posting));
                setJsonSurvey(json);
            } catch (e) {}
        }

        fetchResources();
    }, [posting, dispatch]);

    const survey = new Model(jsonSurvey);
    survey.applyTheme(DoubleBorderLightPanelless);
    // When we preview the survey, we want to see all the questions rather than a per-page view.
    survey.questionsOnPageMode = "singlePage";
    survey.onComplete.add((result) =>
        console.log("GOT SURVEY RESULTS", result.data)
    );

    // The utorid is auto-filled when the user is actually taking a survey.
    survey.data = {
        utorid: "XXXXX",
    };

    return (
        <Paper
            elevation={2}
            sx={{
                p: 2,
                maxHeight: "100vh",
                overflow: "auto",
                display: "flex",
                flexDirection: "column",
            }}
        >
            <Alert severity="info">
                All pages of this survey are shown together. There will also be some dynamically
                generated content near the end of the survey not shown here, this preview
                shows only the fixed content.
            </Alert>
            <Survey model={survey} />
        </Paper>
    );
}
