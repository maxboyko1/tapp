import React from "react";
import { Box, Button, Menu, MenuItem, Tooltip, Typography } from "@mui/material";

const ident = () => {};

/**
 * A toggle switch for setting the active user. Only available in debug mode.
 *
 * @export
 * @returns {React.ElementType}
 */
function ActiveUserButton({
    users = [],
    activeUser = {},
    setActiveUser = ident,
    fetchUsers = ident,
}) {
    const [anchorEl, setAnchorEl] = React.useState(null);

    const handleOpen = (event) => {
        setAnchorEl(event.currentTarget);
        fetchUsers();
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleSelect = (i) => {
        setActiveUser(users[i]);
        handleClose();
    };

    return (
        <Box
            className="logged-in-as-container"
            sx={{ display: "flex", alignItems: "center", gap: 0 }}
        >
            <Typography component="span" sx={{ mr: 1 }}>
                Logged in as
            </Typography>
            <Tooltip
                title="Set which user you are currently logged in as. This is only available when the server is running in debug mode."
                arrow
            >
                <Button
                    variant="contained"
                    color="secondary"
                    size="small"
                    onClick={handleOpen}
                >
                    {activeUser.utorid || "Select User"}
                </Button>
            </Tooltip>
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                slotProps={{
                    list: {
                        dense: true,
                        sx: { p: 0 }
                    },
                    sx: {
                        bgcolor: "secondary.main",
                        color: "#fff",
                    },
                }}
            >
                {(users || []).map((user, i) => (
                    <MenuItem
                        key={i}
                        selected={activeUser.utorid === user.utorid}
                        onClick={() => handleSelect(i)}
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
                        {user.utorid} ({(user.roles || []).join(", ")})
                    </MenuItem>
                ))}
            </Menu>
        </Box>
    );
}

export { ActiveUserButton };