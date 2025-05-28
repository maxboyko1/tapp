import {
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    Stack,
} from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import CloseIcon from "@mui/icons-material/Close";

import { sortMap, SortType, SortListItem } from "./sorts";

export const defaultSortList: SortListItem[] = [
    {
        name: "Department",
        asc: true,
    },
    {
        name: "Program",
        asc: false,
    },
    {
        name: "Year in Progress",
        asc: true,
    },
];

/**
 * A collection of dropdown lists (SortDropdown) for applying sorts.
 */
export function SortBar({
    sortList,
    setSortList,
}: {
    sortList: SortListItem[];
    setSortList: (arg0: SortListItem[]) => void;
}) {
    return (
        <div className="sort-dropdown-container">
            {sortList.map((item, index) => {
                return (
                    <SortDropdown
                        key={index}
                        index={index}
                        selected={item.name}
                        sortList={sortList}
                        setSortList={setSortList}
                    />
                );
            })}
            <SortDropdown
                key={sortList.length}
                index={sortList.length}
                selected={null}
                sortList={sortList}
                setSortList={setSortList}
            />
        </div>
    );
}

/**
 * A set of items including a dropdown list of sorting types,
 * a button for specifying whether the sort should be done in ascending/descending order,
 * and a button for removing the sort from the sorting list.
 */
function SortDropdown({
    index,
    selected,
    sortList,
    setSortList,
}: {
    index: number;
    selected: string | null;
    sortList: SortListItem[];
    setSortList: (arg0: SortListItem[]) => void;
}) {
    let items: SortListItem[];

    return (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel id={`sort-select-label-${index}`}>Sort by...</InputLabel>
                <Select
                    labelId={`sort-select-label-${index}`}
                    value={selected || ""}
                    label="Sort by..."
                    onChange={(e) => {
                        items = [...sortList];
                        const newSortItem: SortListItem = {
                            asc: true,
                            name: e.target.value as SortType,
                        };
                        items[index] = newSortItem;
                        setSortList(items);
                    }}
                    size="small"
                >
                    {Object.keys(sortMap).map((item) => (
                        <MenuItem key={item} value={item}>
                            {item}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
            {selected && (
                <IconButton
                    className="sort-icon"
                    size="small"
                    onClick={() => {
                        items = [...sortList];
                        items[index] = {
                            ...items[index],
                            asc: !items[index]["asc"],
                        };
                        setSortList(items);
                    }}
                >
                    {sortList[index]["asc"] ? (
                        <ArrowUpwardIcon fontSize="small" />
                    ) : (
                        <ArrowDownwardIcon fontSize="small" />
                    )}
                </IconButton>
            )}
            {selected && (
                <IconButton
                    className="sort-icon"
                    size="small"
                    onClick={() => {
                        items = [...sortList];
                        items.splice(index, 1);
                        setSortList(items);
                    }}
                >
                    <CloseIcon fontSize="small" />
                </IconButton>
            )}
        </Stack>
    );
}
