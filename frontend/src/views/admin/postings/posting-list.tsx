import React from "react";
import { useSelector } from "react-redux";
import SearchIcon from "@mui/icons-material/Search";
import { IconButton, Typography } from "@mui/material";

import { postingsSelector, upsertPosting } from "../../../api/actions";
import type { Posting } from "../../../api/defs/types";
import { AdvancedFilterTable, AdvancedColumnDef } from "../../../components/advanced-filter-table";
import { useThunkDispatch } from "../../../libs/thunk-dispatch";
import { Link } from "react-router-dom";
import { EditCustomQuestionsCell } from "./custom-questions-cell";
import { generateDateColumnProps } from "../../../components/table-utils";

export function ConnectedPostingsList({ editable = true }) {
    const postings: Posting[] = useSelector(postingsSelector);
    const dispatch = useThunkDispatch();

    function handleEditRow(original: Posting, values: Partial<Posting>) {
        dispatch(upsertPosting({ ...original, ...values }));
    }

    const DEFAULT_COLUMNS: AdvancedColumnDef<Posting>[] = [
        {
            header: "Details",
            id: "details-col",
            size: 80,
            enableResizing: false,
            Cell: ({ row }) => {
                const posting = row.original;
                return (
                    <IconButton
                        component={Link}
                        to={`/postings/${posting.id}/details`}
                        title={`View details of ${posting.name}`}
                    >
                        <SearchIcon />
                    </IconButton>
                );
            },
        },
        {
            header: "Name",
            accessorKey: "name",
            meta: { editable: true },
        },
        {
            header: "Open Date",
            accessorKey: "open_date",
            meta: { editable: true },
            ...generateDateColumnProps(),
        },
        {
            header: "Close Date",
            accessorKey: "close_date",
            meta: { editable: true },
            ...generateDateColumnProps(),
        },
        {
            header: "Availability",
            id: "availability",
            Cell: ({ row }) => {
                const posting = row.original;
                const status = posting.open_status ? "Open" : "Closed";
                return (
                    <Typography variant="body2">
                        {status} ({posting.availability})
                    </Typography>
                );
            },
        },
        {
            header: "Custom Questions",
            accessorKey: "custom_questions",
            Cell: (props) => <EditCustomQuestionsCell {...props} showQuestions={true} />,
        },
    ];

    return (
        <React.Fragment>
            <AdvancedFilterTable
                columns={DEFAULT_COLUMNS}
                filterable={true}
                data={postings}
                editable={editable}
                onEditRow={handleEditRow}
            />
        </React.Fragment>
    );
}
