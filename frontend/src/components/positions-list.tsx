import React from "react";
import PropTypes from "prop-types";
import { Chip } from "@mui/material";

import { formatDate } from "../libs/utils";
import { createDiffColumnsFromColumns } from "./diff-table";
import { generateHeaderCellProps } from "./table-utils";
import { AdvancedFilterTable, AdvancedColumnDef } from "./advanced-filter-table";
import { Instructor, MinimalPosition, Position } from "../api/defs/types";
import { DiffSpec } from "../libs/diffs";

const DEFAULT_COLUMNS: AdvancedColumnDef<Position>[] = [
    {
        ...generateHeaderCellProps("Position Code"),
        accessorKey: "position_code"
    },
    {
        ...generateHeaderCellProps("Position Title"),
        accessorKey: "position_title",
    },
    {
        ...generateHeaderCellProps("Hours"),
        accessorKey: "hours_per_assignment",
        muiTableBodyCellProps: { className: "number-cell" },
    },
    {
        ...generateHeaderCellProps("Start"),
        accessorKey: "start_date",
        Cell: ({ cell }) => {
            const value = cell?.getValue?.();
            return typeof value === "string" && value ? formatDate(value) : "";
        },
    },
    {
        ...generateHeaderCellProps("End"),
        accessorKey: "end_date",
        Cell: ({ cell }) => {
            const value = cell?.getValue?.();
            return typeof value === "string" && value ? formatDate(value) : "";
        },
    },
    {
        ...generateHeaderCellProps("Instructors"),
        accessorKey: "instructors",
        Cell: ({ cell }) => {
            const value = cell?.getValue?.();
            if (Array.isArray(value)) {
                return (
                    <React.Fragment>
                        {value.map((instructor: Instructor) => (
                            <Chip
                                variant="outlined"
                                color="primary"
                                label={`${instructor.first_name} ${instructor.last_name}`}
                                key={instructor.id}
                                size="small"
                                sx={{ mr: 0.5 }}
                            />
                        ))}
                    </React.Fragment>
                );
            }
            return "";
        },
    },
    {
        ...generateHeaderCellProps("Enrolled"),
        accessorKey: "current_enrollment",
    },
    {
        ...generateHeaderCellProps("Waitlist"),
        accessorKey: "current_waitlisted",
    },
    {
        ...generateHeaderCellProps("Contract Template"),
        accessorKey: "contract_template.template_name",
        Cell: ({ cell }) => {
            const value = cell?.getValue?.();
            return typeof value === "string" ? value : "";
        },
    },
    {
        ...generateHeaderCellProps("Custom Questions"),
        accessorKey: "custom_questions",
        Cell: ({ cell }) => {
            const value = cell?.getValue?.();
            if (
                value &&
                typeof value === "object" &&
                "elements" in value &&
                Array.isArray((value as any).elements)
            ) {
                return (value as any).elements.map((q: any) => q.name).join(", ");
            }
            return "";
        },
    }
];

/**
 * Display a DiffSpec array of positions and highlight the changes.
 *
 * @export
 * @param {*} { modifiedInstructors }
 * @returns
 */
export function PositionsDiffList({
    modifiedPositions,
}: {
    modifiedPositions: DiffSpec<MinimalPosition, Position>[];
}) {
    // Special handling for contract template column diffs, showing the template_name
    const diffColumns = DEFAULT_COLUMNS.map((col) =>
        col.accessorKey === "contract_template.template_name"
            ? {
                  ...col,
                  accessorKey: "contract_template",
                  Cell: ({ cell }: { cell: any }) => {
                      const value = cell?.getValue?.();
                      if (typeof value === "string") {
                          return value;
                      }
                      if (value && typeof value === "object" && "template_name" in value) {
                          return value.template_name;
                      }
                      return "";
                  },
              }
            : col
    );

    return (
        <PositionsList
            positions={modifiedPositions}
            columns={createDiffColumnsFromColumns<Position>(
                diffColumns as any[]
            )}
        />
    );
}

/**
 * List the instructors using a ReactTable. `columns` can be passed
 * in to customize columns/cell renderers.
 */
export function PositionsList(props: {
    positions:
        | Position[]
        | Omit<Position, "id">[]
        | DiffSpec<MinimalPosition, Position>[]
    columns?: AdvancedColumnDef<any>[];
    deleteable?: boolean;
    onDelete?: (row: any) => void;
    deleteBlocked?: (row: any) => string | false;
    editable?: boolean;
    onEditRow?: (row: any, values: any) => void;
}) {
    const {
        positions,
        columns = DEFAULT_COLUMNS,
        deleteable = false,
        onDelete,
        deleteBlocked,
        editable = false,
        onEditRow,
    } = props;
    return (
        <AdvancedFilterTable
            columns={columns}
            data={positions}
            filterable={true}
            deleteable={deleteable}
            onDelete={onDelete}
            deleteBlocked={deleteBlocked}
            editable={editable}
            onEditRow={onEditRow}
        />
    );
}
PositionsList.propTypes = {
    positions: PropTypes.array.isRequired,
    columns: PropTypes.arrayOf(
        PropTypes.shape({ Header: PropTypes.any.isRequired })
    ),
};
