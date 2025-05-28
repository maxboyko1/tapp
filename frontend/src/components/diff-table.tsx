import { MRT_Cell, MRT_ColumnDef } from "material-react-table";
import { DiffSpec } from "../libs/diffs";

/**
 * Create a `DiffCell` that will render a field's modification if
 * one is present. Otherwise, render the original value.
 *
 * @param {*} accessor
 * @returns
 */
export function createDiffCell<T extends object>({
    accessorKey,
    Cell,
}: { accessorKey: string; Cell?: any }) {
    const accessors = String(accessorKey).split(".");
    function get(obj: any) {
        let ret = obj;
        for (const key of accessors) {
            if (ret == null) {
                return undefined;
            }
            ret = ret[key];
        }
        return ret;
    }

    /**
     * If a particular cell has been modified, render the "modification description".
     * Otherwise, render the actual value.
     *
     * @param {*} {original}
     * @returns
     */
    function DiffCell(props: {
        cell: MRT_Cell<DiffSpec<any, T>>;
    }) {
        const original = props.cell.row.original;
        const value = get(original.obj);
        const changed = get(original.changes);
        if (changed != null) {
            return (
                <div
                    className="diff-changed-cell bg-primary text-white"
                    title={changed}
                >
                    {changed}
                </div>
            );
        }
        // If there is a custom cell renderer, use that. Otherwise, pass the value directly.
        // However, we return `null` instead instead of an undefined value
        // (if there happens to be one) to prevent the ReactTable from crashing.
        return Cell
            ? Cell({ value, original: original.obj })
            : value == null
            ? null
            : value;
    }
    return DiffCell;
}

/**
 * Take a react table column specification and convert it to a specification for a diff table.
 *
 * @param {*} columns
 * @returns
 */
export function createDiffColumnsFromColumns<T extends object>(
    columns: (MRT_ColumnDef<T> & { accessorKey?: string })[]
): MRT_ColumnDef<DiffSpec<any, T>>[] {
    return columns.map((column) => {
        const {
            accessorKey,
            header,
            size,
            minSize,
            maxSize,
            enableSorting,
            enableColumnFilter,
            Cell,
            meta,
            // add any other display-only props you use
        } = column;

        const safeAccessorKey = String(accessorKey);

        return {
            id: accessorKey,
            accessorKey,
            header,
            size,
            minSize,
            maxSize,
            enableSorting,
            enableColumnFilter,
            meta,
            Cell: createDiffCell({ accessorKey: safeAccessorKey, Cell }),
        };
    });
}