import React from "react";
import { Button, Box, ListSubheader, Menu, MenuItem, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import "./action-buttons.css";

interface PropsWithChildren {
    [attr: string]: any;
    children: React.ReactNode;
}
interface ActionButtonProps extends PropsWithChildren {
    icon?: React.ReactNode;
    endIcon?: React.ReactNode;
    active?: boolean;
    disabled?: any;
    onClick?: (event: React.MouseEvent<HTMLElement>) => void;
}

interface ActionMenuButtonProps extends ActionButtonProps {
    menu: React.ReactNode[];
}

/**
 * Container to house `ActionButton`s.
 *
 * @export
 * @param {PropsWithChildren} { children }
 * @returns
 */
export function ActionsList({ children }: PropsWithChildren) {
    return (
        <Box
            className="page-actions"
            sx={{
                bgcolor: theme => alpha(theme.palette.info.light, 0.25),
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                width: "max-content",
            }}
        >
            {children}
        </Box>
    );
}

/**
 * Label a group of `ActionButton`s
 *
 * @export
 * @param {PropsWithChildren} { children }
 * @returns
 */
export function ActionHeader({ children }: PropsWithChildren) {
    return (
        <ListSubheader
            sx={{
                bgcolor: "inherit",
                whiteSpace: "nowrap",
            }}
        >
            {children}
        </ListSubheader>
    );
}

/**
 * An action button. Behaves like a button but is styled to fit in the `ActionsList`
 * area. Accepts an optional `icon` and an `active` boolean which determines whether
 * the button is permanently highlighted.
 *
 * @export
 * @param {ActionButtonProps} {
 *     icon = null,
 *     children,
 *     active,
 *     ...rest
 * }
 * @returns
 */
export function ActionButton({
    icon = null,
    endIcon = null,
    children,
    active,
    disabled,
    onClick,
    ...rest
}: ActionButtonProps) {
    const iconNode = icon ? (
        <Box sx={{ mr: 1, display: "flex", alignItems: "center" }}>
            {icon}
        </Box>
    ) : null;
    const endIconNode = endIcon;
    return (
        <MenuItem
            selected={!!active}
            disabled={!!disabled}
            onClick={onClick}
            sx={{ bgColor: "inherit" }}
            {...rest}
        >
            {iconNode}
            <Typography variant="body2">
                {children}
            </Typography>
            {endIconNode}
        </MenuItem>
    );
}

/**
 * Display an action button with a `menu` that can be toggled. `menu` is expected
 * to be a React component. If you want a list of items in the menu, you may wrap
 * them in a `<React.Fragment />` tag. You can (and should) use `ActionButton`s in
 * the menu.
 *
 * @export
 * @param {ActionMenuButtonProps} {
 *     icon = null,
 *     children,
 *     menu = null,
 *     active,
 *     ...rest
 * }
 * @returns
 */
export function ActionMenuButton({
    icon = null,
    children,
    menu = [],
    active,
    disabled = false,
    ...rest
}: ActionMenuButtonProps) {
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

    const iconNode = icon;

    const handleButtonClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    return (
        <>
            <Button
                startIcon={iconNode}
                onClick={handleButtonClick}
                disabled={disabled}
                variant={active ? "contained" : "outlined"}
                sx={{ bgcolor: "inherit" }}
                {...rest}
            >
                {children}
            </Button> 
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "left",
                }}
                transformOrigin={{
                    vertical: "top",
                    horizontal: "left",
                }}
                sx={{ bgcolor: "inherit" }}
            >
                {menu}
            </Menu>
        </>
    );
}
