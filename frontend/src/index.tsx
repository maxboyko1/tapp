import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { HashRouter } from "react-router-dom";
import { PersistGate } from "redux-persist/integration/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

import DynamicEntryRouter from "./dynamic-entry-router";
import { store, persistor } from "./store";
import { themeOptions } from "./theme";

// In production, we don't want to wrap the app in a dev frame,
// but we do want to in development
let DevFrame = function (props: any) {
    return <React.Fragment>{props.children}</React.Fragment>;
};
if (process.env.REACT_APP_DEV_FEATURES) {
    // We only want to load the dev frame parts if they are needed,
    // so we use React.lazy to load them on demand.
    const FullDevFrame = React.lazy(async () =>
        import("./views/dev_frame").then((module) => ({
            // Because `React.lazy` expects a default export, we need to fake
            // the default export in the case of a named export.
            default: module.DevFrame,
        }))
    );
    DevFrame = function (props) {
        return (
            <React.Suspense fallback="Loading...">
                <FullDevFrame>{props.children}</FullDevFrame>
            </React.Suspense>
        );
    };
}

const render = (Component: React.ElementType) => {
    const container = document.getElementById("root");
    if (!container) return;
    const root = createRoot(container);
    const theme = createTheme(themeOptions);

    root.render(
        <ThemeProvider theme={theme}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
                <HashRouter>
                    <Provider store={store}>
                        <PersistGate persistor={persistor}>
                            <DevFrame>
                                <Component />
                            </DevFrame>
                        </PersistGate>
                    </Provider>
                </HashRouter>
            </LocalizationProvider>
        </ThemeProvider>
    );
};

render(DynamicEntryRouter);

// Hot module reloading
// https://medium.com/@brianhan/hot-reloading-cra-without-eject-b54af352c642

/*eslint-disable */
if ("hot" in module) {
    (module as any).hot.accept("./dynamic-entry-router", () => {
        const NextApp = require("./dynamic-entry-router").default;
        render(NextApp);
    });
}
/*eslint-enable */
