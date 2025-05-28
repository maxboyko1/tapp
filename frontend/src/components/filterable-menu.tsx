import React from "react";
import PropTypes from "prop-types";
import { Menu, MenuItem, TextField, Typography } from "@mui/material";

import { HasId } from "../api/defs/types";

interface FilterableMenuProps {
    items: (HasId & { name: string })[];
    activeItemId: number | null;
    clearFilter: boolean;
    anchorEl: null | HTMLElement;
    open: boolean;
    onClose: () => void;
    onSelect: (item: HasId & { name: string }, index: number) => void;
}

/**
 * A menu that nests inside a `Dropdown`. Pass in a list
 * `items` which are objects of the form `{id: ..., name: ...}`.
 * When `onSelect` is triggered, it will be passed the index of the clicked-upon
 * item in the `items` array.
 */
export function FilterableMenu({
    items,
    activeItemId,
    clearFilter,
    anchorEl,
    open,
    onClose,
    onSelect,
}: FilterableMenuProps) {
    const [filter, setFilter] = React.useState("");

    React.useEffect(() => {
        if (clearFilter) setFilter("");
    }, [clearFilter, open]);

    const filteredItems = items.filter((item) =>
        item.name.toLowerCase().includes(filter.trim().toLowerCase())
    );

    const emptyListMessage =
        items.length === 0
            ? "No Available Sessions"
            : "No Matching Sessions";

    return (
        <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={onClose}
            sx={{ minWidth: 250 }}
            disableAutoFocusItem
            slotProps={{paper: {
                sx: {
                    bgcolor: "secondary.main",
                    color: "#fff",
                },
            }}}
        >
            <MenuItem disableRipple disableTouchRipple>
                <TextField
                    autoFocus
                    fullWidth
                    size="small"
                    placeholder="Type to filter..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    variant="standard"
                    sx={{
                        tabIndex: 0,
                        input: { color: "#fff" },
                        "& .MuiInput-underline:before": { borderBottomColor: "#fff" },
                        "& .MuiInput-underline:after": { borderBottomColor: "#fff" },
                    }}
                    slotProps={{
                        input: {
                            style: { color: "#fff" },
                        },
                        inputLabel: {
                            style: { color: "#fff" },
                        },
                    }}
                />
            </MenuItem>
            {filteredItems.length > 0 ? (
                filteredItems.map((item, index) => (
                    <MenuItem
                        key={item.id}
                        selected={activeItemId === item.id}
                        onClick={() => {
                            onSelect(item, index);
                            onClose();
                        }}
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
                        {item.name}
                    </MenuItem>
                ))
            ) : (
                <MenuItem disabled>
                    <Typography variant="body2" color="text.secondary">
                        {emptyListMessage}
                    </Typography>
                </MenuItem>
            )}
        </Menu>
    )    
}
FilterableMenu.propTypes = {
    items: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.any.isRequired,
            name: PropTypes.string.isRequired,
        })
    ),
    activeItemId: PropTypes.any,
    clearFilter: PropTypes.bool,
};
