import React from "react";
import {
    MaterialReactTable,
    MRT_ColumnDef,
    MRT_Row,
    MRT_RowData,
} from "material-react-table";
import {
    Alert,
    Box,
    IconButton,
    TextField,
    Tooltip,
    Typography
} from "@mui/material";
import CancelIcon from "@mui/icons-material/Cancel";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import LockIcon from "@mui/icons-material/Lock";
import SaveIcon from "@mui/icons-material/Save";

/**
 * Extension of standard material-react-table column definitions for AdvancedFilterTable for defining
 * custom cell "editing mode" behaviour, according to the data type and contents of the cell.
 */
export type AdvancedColumnDef<T extends MRT_RowData> = MRT_ColumnDef<T> & {
    EditCell?: (props: {
        value: any;
        onChange: (value: any) => void;
        row: MRT_Row<T>;
        editValues: any;
    }) => React.ReactNode;
};

/**
 * A MaterialReactTable that (optionally) supports filtering, row selection, as well as individual
 * row editing or deletion. Includes props for handler functions setSelected, onDelete and onEditRow
 * for defining row selection, deletion and editing behaviour respectively, each of which may be 
 * blocked for any specific row for whatever reason as defined by the isRowSelectable, deleteBlocked
 * and editBlocked props respectively, optionally providing the user with help text in this case.
 */
export function AdvancedFilterTable({
    columns,
    data,
    filterable = false,
    selectable = false,
    selected = [],
    setSelected,
    isRowSelectable = (_row) => true,
    deleteable = false,
    onDelete,
    deleteBlocked,
    editable = false,
    onEditRow,
    editBlocked,
}: {
    columns: AdvancedColumnDef<any>[];
    data: any[];
    filterable?: boolean;
    selectable?: boolean;
    selected?: number[];
    setSelected?: (selected: number[]) => void;
    isRowSelectable?: (row: any) => boolean;
    deleteable?: boolean;
    onDelete?: (row: any) => void;
    deleteBlocked?: (row: any) => string | false;
    editable?: boolean;
    onEditRow?: (row: any, values: any) => void;
    editBlocked?: (row: any) => string | false;
}) {
    const [density, setDensity] = React.useState<"comfortable" | "compact" | "spacious">("compact");
    const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({});
    const [editingRowId, setEditingRowId] = React.useState<string | null>(null);
    const [editValues, setEditValues] = React.useState<any>({});

    const tableContainerRef = React.useRef<HTMLDivElement>(null);
    const scrollLeftRef = React.useRef<number>(0);

    // Save scroll position before entering edit mode
    const handleStartEdit = (rowId: string, rowOriginal: any) => {
        if (tableContainerRef.current) {
            scrollLeftRef.current = tableContainerRef.current.scrollLeft;
        }
        setEditingRowId(rowId);
        setEditValues(rowOriginal);
    };

    // Restore scroll position after entering edit mode
    React.useEffect(() => {
        if (editingRowId && tableContainerRef.current) {
            tableContainerRef.current.scrollLeft = scrollLeftRef.current;
        }
    }, [editingRowId]);

    // Convert selected numbers to strings for MRT
    const selectedStringIds = selectable ? selected.map(String) : [];

    // Only allow selection of rows that are selectable
    const selectableIds = React.useMemo(
        () => selectable ? data.filter(isRowSelectable).map((row) => String(row.id)) : [],
        [data, isRowSelectable, selectable]
    );

    // When MRT selection changes, convert string IDs back to numbers and filter out invalid ones
    React.useEffect(() => {
        if (!selectable || !setSelected) return;
        const selectedIds = Object.keys(rowSelection)
            .filter((key) => rowSelection[key] && selectableIds.includes(key))
            .map(Number)
            .filter((id) => !isNaN(id));
        setSelected(selectedIds);
    }, [rowSelection, setSelected, selectableIds, selectable]);

    // Sync MRT's rowSelection state with selected prop
    React.useEffect(() => {
        if (!selectable) return;
        const newRowSelection: Record<string, boolean> = {};
        selectedStringIds.forEach((id) => {
            if (selectableIds.includes(id)) {
                newRowSelection[id] = true;
            }
        });
        if (
            Object.keys(rowSelection).length !== Object.keys(newRowSelection).length ||
            Object.keys(rowSelection).some((id) => !newRowSelection[id])
        ) {
            setRowSelection(newRowSelection);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedStringIds.join(","), data.length, selectableIds.join(","), selectable]);

    // If table is declared editable, prepare its individually editable columns for editing
    const enhancedColumns = columns.map((col) => {
        // Only enhance if editable and column is marked editable
        const isEditable = !!editable && !!col.meta && (col.meta as any).editable;
        const accessorKey = typeof col.accessorKey === "string" ? col.accessorKey : undefined;
        const OriginalCell = col.Cell; // For default cell rendering, when not in edit mode

        if (!isEditable || !accessorKey) return col;

        return {
            ...col,
            Cell: (props: any) => {
                const { cell, row } = props;
                if (editingRowId === row.id) {
                    // Use custom EditCell if provided
                    if (col.EditCell) {
                        return col.EditCell({
                            value: editValues[accessorKey] ?? cell.getValue(),
                            onChange: (value: any) =>
                                setEditValues((vals: any) => ({
                                    ...vals,
                                    [accessorKey]: value,
                                })),
                            row,
                            editValues,
                        });
                    }
                    // Otherwise, default to text input
                    return (
                        <TextField
                            value={editValues[accessorKey] ?? cell.getValue()}
                            onChange={(e) =>
                                setEditValues((vals: any) => ({
                                    ...vals,
                                    [accessorKey]: e.target.value,
                                }))
                            }
                            size="small"
                            variant="standard"
                            fullWidth
                            autoFocus
                        />
                    );
                }
                return OriginalCell
                    ? OriginalCell(props)
                    : cell.getValue();
            },
        };
    });

    return (
        <Box>
            <MaterialReactTable
                columns={enhancedColumns}
                data={data}
                enableEditing={editable}
                enableRowSelection={selectable ? (row) => isRowSelectable(row.original) : false}
                enableGlobalFilter={filterable}
                enableColumnResizing
                enableSorting
                enableStickyHeader
                enableBottomToolbar={false}
                enablePagination={false}
                enableRowVirtualization
                muiTableContainerProps={{
                    sx: { maxHeight: 600 },
                    ref: tableContainerRef,
                }}
                initialState={{
                    density: "compact",
                    columnPinning: {
                        left: ['mrt-row-actions'],
                    },
                }}
                state={selectable ? { rowSelection, density } : { density }}
                onDensityChange={setDensity}
                onRowSelectionChange={selectable ? setRowSelection : undefined}
                getRowId={(row) => String(row.id ?? '')}
                muiTableBodyCellProps={selectable ? ({ row, column }) => {
                    if (
                        column.id === "mrt-row-select" &&
                        !isRowSelectable(row.original)
                    ) {
                        return {
                            sx: { pointerEvents: "none", opacity: 0.3 },
                        };
                    }
                    return {};
                } : undefined}
                renderTopToolbarCustomActions={({ table }) => 
                    filterable ? (
                        <Typography variant="body2" sx={{ p: 2 }}>
                            Showing {table.getFilteredRowModel().rows.length} rows
                        </Typography>
                    ) : null
                }
                enableRowActions={editable || deleteable}
                renderRowActions={({ row }) => {
                    if (deleteable && onDelete) {
                        const blockReason = deleteBlocked?.(row.original);
                        if (blockReason) {
                            return (
                                <Tooltip title={blockReason}>
                                    <span>
                                        <IconButton disabled size="small">
                                            <LockIcon />
                                        </IconButton>
                                    </span>
                                </Tooltip>
                            );
                        }
                        return (
                            <IconButton
                                onClick={() => onDelete(row.original)}
                                title="Delete Row"
                                color="error"
                            >
                                <DeleteIcon />
                            </IconButton>
                        );
                    }
                    if (editable && onEditRow) {
                        const blockReason = editBlocked?.(row.original);
                        if (blockReason) {
                            return (
                                <Tooltip title={blockReason}>
                                    <span>
                                        <IconButton disabled size="small">
                                            <LockIcon />
                                        </IconButton>
                                    </span>
                                </Tooltip>
                            )
                        }
                        if (editingRowId === row.id) {
                            return (
                                <>
                                    <IconButton
                                        size="small"
                                        onClick={() => {
                                            onEditRow?.(row.original, editValues);
                                            setEditingRowId(null);
                                            setEditValues({});
                                        }}
                                        title="Save"
                                    >
                                        <SaveIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        onClick={() => {
                                            setEditingRowId(null);
                                            setEditValues({});
                                        }}
                                        title="Cancel"
                                    >
                                        <CancelIcon fontSize="small" />
                                    </IconButton>
                                </>
                            );
                        }
                        return (
                            <IconButton
                                size="small"
                                onClick={() => handleStartEdit(row.id, row.original)}
                                title="Edit"
                            >
                                <EditIcon fontSize="small" />
                            </IconButton>
                        );
                    }
                    return null;
                }}
            />
            {selectable && selectedStringIds.length > 0 && selectedStringIds.some((id) => !data.find((row) => String(row.id) === id)) && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                    <Typography>
                        Some selected rows are not currently visible.
                    </Typography>
                </Alert>
            )}
        </Box>
    );
}