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
 * Generates a header cell for a Material-UI table with a tooltip on hover.
 * 
 * @param name The visible header text
 * @param title Optional tooltip text (defaults to `name`)
 * @returns A function that renders the header cell
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

export function generateDateColumnProps<T extends MRT_RowData = MRT_RowData>() {
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
                    // Format as YYYY-MM-DD for storage
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
            let value = props.cell.getValue() as string | undefined;
            if (!value || typeof value !== "string") return "";

            // Always extract YYYY-MM-DD and parse as local date
            const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
            if (!match) return value;
            const [, year, month, day ] = match;
            const date = new Date(Number(year), Number(month) - 1, Number(day));
            return isNaN(date.getTime()) ? "" : format(date, "MMM d, yyyy");
        },
    };
}

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
                label={getLabel(cell.getValue() as ValueType)}
                size="small"
            />
        )
    };
}

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
                            <Chip
                                color="primary"
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