import React from "react";
import PropTypes from "prop-types";
import { ActionButton } from "./action-buttons";
import { Button, Menu, MenuItem } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { ExportFormat } from "../libs/import-export";

/**
 * Export button that offers the ability to export as Spreadsheet/CSV/JSON.
 * `onClick` is called when the button is clicked and supplied with
 * one of "spreadsheet", "csv", or "json".
 *
 * @param {*} props
 * @returns
 */
export function ExportButton(props: {
    onClick?: (format: ExportFormat) => any;
}) {
    const { onClick: clickCallback } = props;
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    function handleSelect(option: ExportFormat) {
        if (clickCallback) {
            clickCallback(option);
        }
        handleMenuClose();
    }

    return (
        <>
            <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleMenuOpen}
            >
                Export
            </Button>
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "left",
                }}
                transformOrigin={{
                    vertical: "top",
                    horizontal: "left",
                }}
            >
                <MenuItem onClick={() => handleSelect("spreadsheet")}>
                    As Spreadsheet
                </MenuItem>
                <MenuItem onClick={() => handleSelect("csv")}>
                    As CSV
                </MenuItem>
                <MenuItem onClick={() => handleSelect("json")}>
                    As JSON
                </MenuItem>
            </Menu>
        </>
    );
}
ExportButton.propTypes = {
    onClick: PropTypes.func.isRequired,
};

/**
 * Export button that offers the ability to export as Spreadsheet/CSV/JSON.
 * `onClick` is called when the button is clicked and supplied with
 * one of "spreadsheet", "csv", or "json".
 *
 * @param {*} props
 * @returns
 */
export function ExportActionButton(props: {
    onClick?: (format: ExportFormat) => any;
    disabled?: boolean;
}) {
    const { onClick: clickCallback, disabled = false } = props;
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleMenuClose = () => setAnchorEl(null);

    function handleSelect(format: ExportFormat) {
        handleMenuClose();
        if (clickCallback) clickCallback(format);
    }

    return (
        <>
            <ActionButton
                icon={<DownloadIcon />}
                endIcon={<ArrowDropDownIcon />}
                onClick={handleMenuOpen}
                disabled={disabled}
            >
                Export
            </ActionButton>
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "left",
                }}
                transformOrigin={{
                    vertical: "top",
                    horizontal: "left",
                }}
            >
                <ActionButton onClick={() => handleSelect("spreadsheet")}>
                    As Spreadsheet
                </ActionButton>
                <ActionButton onClick={() => handleSelect("csv")}>
                    As CSV
                </ActionButton>
                <ActionButton onClick={() => handleSelect("json")}>
                    As JSON
                </ActionButton>
            </Menu>
        </>
    );
}
ExportButton.propTypes = {
    onClick: PropTypes.func.isRequired,
};
