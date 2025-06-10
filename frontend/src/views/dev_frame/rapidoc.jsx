import React from "react";
import { useTheme } from "@mui/material/styles";
import "rapidoc/dist/rapidoc-min.js";

/**
 * React wrapper component for rapi-doc, an API documentation generator web component.
 * @param {*} spec - The SwaggerUI specification to load
 * @returns 
 */
export default function RapiDoc({ spec }) {
    const ref = React.useRef(null);
    const theme = useTheme();

    React.useEffect(() => {
        if (ref.current) {
            ref.current.loadSpec(spec);
        }
    }, [spec]);

    return (
        <rapi-doc
            ref={ref}
            render-style="view"
            theme="light"
            header-color={theme.palette.primary.main}
            primary-color={theme.palette.secondary.main}
            style={{ width: "100%", height: "100vh" }}
        ></rapi-doc>
    );
}