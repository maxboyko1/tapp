import React from "react";
import { AdvancedFilterTable, AdvancedColumnDef } from "./advanced-filter-table";
import { ContractTemplate } from "../api/defs/types";

const DEFAULT_COLUMNS: AdvancedColumnDef<ContractTemplate>[] = [
    { 
        header: "Template Name",
        accessorKey: "template_name"
    },
    {
        header: "Template File",
        accessorKey: "template_file",
    },
];

/**
 * List the contract templates using a ReactTable. `columns` can be passed
 * in to customize columns/cell renderers.
 */
export function ContractTemplatesList(props: {
    contractTemplates: ContractTemplate[];
    columns?: AdvancedColumnDef<ContractTemplate>[];
    onEditRow?: (row: ContractTemplate, values: Partial<ContractTemplate>) => void;
}) {
    const { contractTemplates, columns = DEFAULT_COLUMNS, onEditRow } = props;
    return (
        <AdvancedFilterTable
            data={contractTemplates}
            columns={columns}
            filterable={true}
            editable={!!onEditRow}
            onEditRow={onEditRow}
        />
    );
}
