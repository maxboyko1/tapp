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
    MRT_Row,
    MRT_RowData,
} from "material-react-table";
import { format } from "date-fns";

import { formatDate, parseLocalDate } from "../libs/utils";
import { HasId } from "../api/defs/types";
import { AdvancedColumnDef } from "./advanced-filter-table";

/**
 * Helper function to extract content from a table cell, given the provided
 * row and column info.
 *
 * @param row The table row item to retrieve the value from
 * @param accessorKey The column name to use as an accessor
 * @returns The value at the specified cell, or undefined if not found
 */
function getValueAtPath(row: unknown, accessorKey?: string): unknown {
    if (!accessorKey || row == null || typeof row !== "object") {
        return undefined;
    }

    return accessorKey
        .split(".")
        .reduce<unknown>((currentValue, key) => {
            if (currentValue == null || typeof currentValue !== "object") {
                return undefined;
            }
            return (currentValue as Record<string, unknown>)[key];
        }, row);
}

/**
 * Helper function to render a date string into our standardized display format
 * to be used for the human-readable cell content as well as the column filter.
 * @param value The date string to format
 * @returns The formatted date string
 */
function formatEditableDateDisplay(value: unknown): string {
    if (!value || typeof value !== "string") {
        return "";
    }

    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) {
        return value;
    }

    const [, year, month, day] = match;
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return isNaN(date.getTime()) ? "" : format(date, "MMM d, yyyy");
}

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
        FilterFunc: (row: T, columnId?: string) =>
            formatEditableDateDisplay(getValueAtPath(row, columnId)),
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
            return formatEditableDateDisplay(props.cell.getValue());
        },
    };
}

/**
 * Generate properties for a fixed date column in an AdvancedFilterTable, defining the
 * content of the cell when in standard display mode (Cell) and ensuring the filter
 * property provided by FilterFunc is using the same content for filtering.
 * 
 * @param accessorKey 
 * @returns 
 */
export function generateFixedDateColumnProps<RowType extends MRT_RowData>(
    accessorKey: keyof RowType & string
): Pick<AdvancedColumnDef<RowType>, "accessorKey" | "FilterFunc" | "Cell"> {
    return {
        accessorKey,
        FilterFunc: (row: RowType) => {
            const value = getValueAtPath(row, accessorKey);
            return typeof value === "string" ? formatDate(value) : "";
        },
        Cell: ({
            cell,
        }: {
            cell: MRT_Cell<RowType, unknown>;
        }) => {
            const value = cell.getValue();
            return typeof value === "string" ? formatDate(value) : "";
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
    clearable = false,
    getOptionsForRow,
}: {
    options: ValueType[];
    getLabel: (option: ValueType) => string;
    clearable?: boolean;
    getOptionsForRow?: (options: ValueType[], row: MRT_Row<RowType>) => ValueType[];
}): Partial<AdvancedColumnDef<RowType>> {
    // Local helper to extract the display label for a given cell value
    const getSingleSelectLabel = (value: unknown): string => {
        if (value == null) {
            return "";
        }

        if (typeof value === "object" && "id" in (value as Record<string, unknown>)) {
            return getLabel(value as ValueType);
        }

        const matchedOption = options.find((option) => option.id === value);
        return matchedOption ? getLabel(matchedOption) : String(value);
    };

    return {
        FilterFunc: (row: RowType, columnId?: string) =>
            getSingleSelectLabel(getValueAtPath(row, columnId)),
        EditCell: ({
            value,
            onChange,
            row,
        }: {
            value: ValueType | null | undefined;
            onChange: (v: ValueType | null) => void;
            row: MRT_Row<RowType>;
        }) => (
            <Autocomplete
                options={getOptionsForRow ? getOptionsForRow(options, row) : options}
                getOptionLabel={getLabel}
                value={value ?? null}
                onChange={(_, newValue) => onChange(newValue)}
                disableClearable={!clearable}
                clearOnEscape={clearable}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        variant="standard"
                        placeholder="Select..."
                    />
                )}
                size="small"
                sx={{ minWidth: 200 }}
                isOptionEqualToValue={(option, selected) => option.id === selected.id}
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
            const label = getSingleSelectLabel(cell.getValue());
            if (!label) {
                return null;
            }

            return (
                <Chip
                    color="primary"
                    variant="outlined"
                    label={label}
                    size="small"
                />
            );
        }
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
    // Local helper to extract the display labels for a given cell value, space-separated
    const getMultiSelectLabels = (value: unknown): string => {
        if (!Array.isArray(value) || value.length === 0) {
            return "";
        }

        return value
            .map((item) => {
                if (item == null) {
                    return "";
                }

                if (typeof item === "object" && "id" in (item as Record<string, unknown>)) {
                    return getLabel(item as ValueType);
                }

                const matchedOption = options.find((option) => option.id === item);
                return matchedOption ? getLabel(matchedOption) : String(item);
            })
            .filter(Boolean)
            .join(" ");
    };

    return {
        FilterFunc: (row: RowType, columnId?: string) =>
            getMultiSelectLabels(getValueAtPath(row, columnId)),
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