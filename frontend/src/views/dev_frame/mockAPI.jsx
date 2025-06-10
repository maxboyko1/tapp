import React from "react";
import { Button, ButtonGroup, Tooltip, Typography } from "@mui/material";
import { connect } from "react-redux";
import { setGlobals, globalsSelector } from "../../api/actions";

/**
 * A toggle switch for turning on and off the Mock API. An instance
 * of the Mock API is included in this component, and this component
 * takes no arguments.
 *
 * This component only renders when `VITE_DEV_FEATURES` env variable is truthy.
 *
 * @export
 * @returns {React.ElementType}
 */
let ToggleMockApi = function ToggleMockApi(props) {
    const { globals, setMockAPIState } = props;
    const active = globals.mockAPI;

    return (
        <Tooltip
            title="The Mock API simulates the TAPP API but uses browser-based storage. This allows you to test TAPP functionality without a working server."
            arrow
        >
            <span>
                <Typography component="span" sx={{ mr: 1 }}>
                    Mock API
                </Typography>
                <ButtonGroup variant="outlined" size="small">
                    <Button
                        color={active ? "primary" : "inherit"}
                        variant={active ? "contained" : "outlined"}
                        onClick={() => setMockAPIState(true)}
                    >
                        On
                    </Button>
                    <Button
                        color={!active ? "primary" : "inherit"}
                        variant={!active ? "contained" : "outlined"}
                        onClick={() => setMockAPIState(false)}
                    >
                        Off
                    </Button>
                </ButtonGroup>
            </span>
        </Tooltip>
    );
};

ToggleMockApi = connect((state) => ({ globals: globalsSelector(state) }), {
    setGlobals,
})(ToggleMockApi);

export { ToggleMockApi };
