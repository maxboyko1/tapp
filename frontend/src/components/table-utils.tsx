import React from "react";
import {
    Autocomplete,
    Chip,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import {
    MRT_Cell,
    MRT_RowData,
} from "material-react-table";
import { format } from "date-fns";

import { parseLocalDate } from "../libs/utils";
import { HasId } from "../api/defs/types";
import { AdvancedColumnDef } from "./advanced-filter-table";

/**
 * Generates a special header cell for an AdvancedFilterTable, with help text on hover.
 * 
 * @param name The standard header text
 * @param title Optional help text (defaults to `name`)
 * @returns header cell properties for the column definitions
 */
export function generateHeaderCellProps(name: string, title?: string) {
    return {
        header: name,
        Header: (
            <Tooltip title={title ?? name} arrow>
                <Typography
                    variant="subtitle2"
                    noWrap
                    sx={{
                        maxWidth: "100%",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                    }}
                >
                    {name}
                </Typography>
            </Tooltip>
        ),
    }
}

/**
 * Generate properties for an editable date column in an AdvancedFilterTable, defining the
 * content of the cell when in edit mode (EditCell) or standard display mode (Cell).
 */
export function generateDateColumnProps<T extends MRT_RowData>() {
    return {
        EditCell: ({
            value,
            onChange,
        }: {
            value: string | null | undefined;
            onChange: (v: string) => void;
        }) => (
            <DatePicker
                value={parseLocalDate(value)}
                onChange={date => {
                    onChange(date ? format(date, "yyyy-MM-dd") : "");
                }}
                slotProps={{
                    textField: {
                        size: "small",
                        variant: "standard",
                        fullWidth: true,
                    }
                }}
            />
        ),
        Cell: (props: {
            cell: MRT_Cell<T, unknown>;
        }) => {
            const value = props.cell.getValue() as string | undefined;
            if (!value || typeof value !== "string") return "";

            const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
            if (!match) return value;
            const [, year, month, day ] = match;
            const date = new Date(Number(year), Number(month) - 1, Number(day));
            return isNaN(date.getTime()) ? "" : format(date, "MMM d, yyyy");
        },
    };
}

/**
 * Helper function to define an editable number cell in an AdvancedFilterTable.
 */
export function generateNumberCell() {
    return function NumberEditCell({ value, onChange }: { value: any; onChange: (val: any) => void }) {
        return (
            <TextField
                type="number"
                value={value ?? ""}
                onChange={e => onChange(e.target.value)}
                size="small"
                variant="standard"
                fullWidth
            />
        );
    };
}

/**
 * Generate properties for an editable column in an AdvancedFilterTable that needs to allow the 
 * user to select a single option from a given list of options in a dropdown menu.
 */
export function generateSingleSelectColumnProps<RowType extends MRT_RowData, ValueType extends HasId>({
    options,
    getLabel,
}: {
    options: ValueType[];
    getLabel: (option: ValueType) => string;
}): Partial<AdvancedColumnDef<RowType>> {
    return {
        EditCell: ({
            value,
            onChange,
        }: {
            value: ValueType | null | undefined;
            onChange: (v: ValueType | null) => void;
        }) => (
            <Autocomplete
                options={options}
                getOptionLabel={getLabel}
                value={value ?? null}
                onChange={(_, newValue) => onChange(newValue)}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        variant="standard"
                        placeholder="Select..."
                    />
                )}
                size="small"
                sx={{ minWidth: 200 }}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderValue={(selected) =>
                    selected ? (
                        <Chip
                            color="primary"
                            variant="outlined"
                            label={getLabel(selected)}
                            size="small"
                        />
                    ) : null
                }
                slotProps={{
                    paper: {
                        sx: (theme) => ({
                            backgroundColor: theme.palette.primary.main,
                            color: theme.palette.primary.contrastText,
                        })
                    }
                }}
            />
        ),
        Cell: ({
            cell,
        }: {
            cell: MRT_Cell<RowType, unknown>;
        }) => (
            <Chip
                color="primary"
                variant="outlined"
                label={getLabel(cell.getValue() as ValueType)}
                size="small"
            />
        )
    };
}

/**
 * Generate properties for an editable column in an AdvancedFilterTable that needs to allow the 
 * user to select (possibly) multiple options from a given list of options in a dropdown menu.
 */
export function generateMultiSelectColumnProps<RowType extends MRT_RowData, ValueType extends HasId>({
    options,
    getLabel,
}: {
    options: ValueType[];
    getLabel: (option: ValueType) => string;
}): Partial<AdvancedColumnDef<RowType>> {
    return {
        EditCell: ({
            value,
            onChange,
        }: {
            value: ValueType[] | null | undefined;
            onChange: (v: ValueType[]) => void;
        }) => (
            <Autocomplete
                multiple
                options={options}
                getOptionLabel={getLabel}
                value={value ?? []}
                onChange={(_, newValue) => onChange(newValue)}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        variant="standard"
                        placeholder="Select..."
                    />
                )}
                size="small"
                sx={{ minWidth: 250 }}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderValue={(selected, getTagProps) => (
                    <Stack direction="row" gap={0.25} flexWrap="wrap">
                        {selected.map((opt, idx) => (
                            // ESLint thinks we need to define a key for this Chip, but getTagProps covers that
                            // eslint-disable-next-line react/jsx-key
                            <Chip
                                color="primary"
                                variant="outlined"
                                label={getLabel(opt)}
                                size="small"
                                {...getTagProps({ index: idx })}
                            />
                        ))}
                    </Stack>
                )}
                slotProps={{
                    paper: {
                        sx: (theme) => ({
                            backgroundColor: theme.palette.primary.main,
                            color: theme.palette.primary.contrastText,
                        })
                    }
                }}
            />
        ),
        Cell: ({
            cell,
        }: {
            cell: MRT_Cell<RowType, unknown>;
        }) => {
            const values = cell.getValue() ?? [] as ValueType[];
            if (!Array.isArray(values) || values.length === 0) {
                return null;
            }
            return (
                <Stack direction="row" gap={0.25} flexWrap="wrap">
                    {values.map((opt: ValueType) => (
                        <Chip
                            color="primary"
                            variant="outlined"
                            key={opt.id}
                            label={getLabel(opt)}
                            size="small"
                        />
                    ))}
                </Stack>
            );
        },
    };
}