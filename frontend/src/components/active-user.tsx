import React from "react";
import { Box, Badge, Button, Menu, MenuItem, Typography } from "@mui/material";
import { User, UserRole } from "../api/defs/types";

const DEFAULT_USER: Omit<User, "id"> = { utorid: "<noid>", roles: [] };

export function ActiveUserDisplay(props: {
    activeUser?: User;
    activeRole?: UserRole | null;
    setActiveUserRole: (role: UserRole) => any;
}) {
    const { activeUser = DEFAULT_USER, activeRole, setActiveUserRole } = props;
    const roles = activeUser.roles;

    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

    const label = !activeRole ? (
        <Typography color="inherit" sx={{ mr: 0.5 }} component="span">
            Select a role
        </Typography>
    ) : (
        <Typography color="inherit" sx={{ mr: 0.5 }} component="span">
            {activeRole}
        </Typography>
    );

    const isActiveRole = (role: UserRole) => activeRole === role;

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleSelect = (role: UserRole) => {
        setActiveUserRole(role);
        handleMenuClose();
    };

    return (
        <Badge color="primary" badgeContent="" sx={{ ".MuiBadge-badge": { display: "none" } }}>
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <Typography variant="body2" color="inherit" sx={{ mb: 0.5 }}>
                    Login: {activeUser.utorid} as
                </Typography>
                <Button
                    color="secondary"
                    variant="contained"
                    onClick={handleMenuOpen}
                    sx={{
                        textTransform: "none",
                    }}
                >
                    {label}
                </Button>
                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                    anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                    transformOrigin={{ vertical: "top", horizontal: "left" }}
                    slotProps={{ paper: {
                        sx: {
                            bgcolor: "secondary.main",
                            color: "#fff",
                        },
                    }}}
                >
                    {(roles || []).map((role, index) => (
                        <MenuItem
                            key={index}
                            selected={isActiveRole(role)}
                            onClick={() => handleSelect(role)}
                            sx={{
                                bgcolor: "secondary.main",
                                color: "#fff",
                                "&.Mui-selected": {
                                    bgcolor: "secondary.dark",
                                    color: "#fff",
                                },
                                "&:hover": {
                                    bgcolor: "secondary.dark",
                                    color: "#fff",
                                },
                            }}
                        >
                            {role}
                        </MenuItem>
                    ))}
                </Menu>
            </Box>
        </Badge>
    );
}
