import React from "react";
import {
    Button,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    FormGroup,
    FormLabel,
    Stack,
} from "@mui/material";
import { FilterType, filterMap } from "./filters";

export const defaultFilterList: Record<FilterType, any[]> = {
    program: [],
    department: [],
    taPositionPref: [0, -1, "other"],
    status: ["unassignable", "hidden"],
    hourFulfillment: [],
};

/**
 * A pop-up window containing a list of filter-able items in the form of checkboxes.
 */
export function FilterModal({
    showFilters,
    setShowFilters,
    filterList,
    setFilterList,
}: {
    showFilters: boolean;
    setShowFilters: (arg0: boolean) => void;
    filterList: Record<FilterType, any[]>;
    setFilterList: (arg0: Record<FilterType, any[]>) => void;
}) {
    // Enforcing an order for the filters to appear
    const filterTypeList: FilterType[] = [
        "department",
        "program",
        "taPositionPref",
        "status",
        "hourFulfillment",
    ];

    return (
        <Dialog
            open={showFilters}
            onClose={() => setShowFilters(false)}
            maxWidth="xl"
            fullWidth
            slotProps={{ paper: { className: "filter-modal" } }}
        >
            <DialogTitle>Filter Applicants</DialogTitle>
            <DialogContent>
                <form className="filter-form">
                    <Stack direction="row" spacing={2} flexWrap="wrap">
                        {filterTypeList.map((filterKey) => (
                            <FormGroup
                                key={filterKey}
                                sx={{
                                    mb: 3,
                                    minWidth: 180,
                                    maxWidth: 220,
                                    border: "1px solid #eee",
                                    borderRadius: 2,
                                    padding: 2,
                                }}
                            >
                                <FormLabel className="filter-section-title" sx={{ mb: 1 }}>
                                    {filterMap[filterKey].label}
                                </FormLabel>
                                {filterMap[filterKey].values.map((filterValue) => (
                                    <FilterCheckbox
                                        key={filterValue.value}
                                        filterType={filterKey}
                                        filterItem={filterValue}
                                        filterList={filterList}
                                        setFilterList={setFilterList}
                                    />
                                ))}
                                {filterMap[filterKey].hasOther && (
                                    <FilterCheckbox
                                        key={`${filterKey}-other`}
                                        filterType={filterKey}
                                        filterItem={{
                                            label: "Other",
                                            value: "other",
                                        }}
                                        filterList={filterList}
                                        setFilterList={setFilterList}
                                    />
                                )}
                                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                                    <Button
                                        onClick={() => {
                                            setFilterList({
                                                ...filterList,
                                                [filterKey]: [],
                                            });
                                        }}
                                        variant="outlined"
                                        size="small"
                                        color="success"
                                    >
                                        Select All
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        color="error"
                                        size="small"
                                        onClick={() => {
                                            const filterKeyAllOptions = filterMap[filterKey].values.map(
                                                filterOption => filterOption.value
                                            );
                                            if (filterMap[filterKey].hasOther) {
                                                filterKeyAllOptions.push("other");
                                            }
                                            setFilterList({
                                                ...filterList,
                                                [filterKey]: filterKeyAllOptions
                                            });
                                        }}
                                    >
                                        Deselect All
                                    </Button>
                                </Stack>
                            </FormGroup>
                        ))}
                    </Stack>
                </form>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setShowFilters(false)} variant="contained" color="secondary">
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
}

/**
 * A single checkbox item that will add or remove a filter item from "filterList" via "setFilterList".
 */
function FilterCheckbox({
    filterType,
    filterItem,
    filterList,
    setFilterList,
}: {
    filterType: FilterType;
    filterItem: { label: string; value: any };
    filterList: Record<FilterType, any[]>;
    setFilterList: (arg0: Record<FilterType, any[]>) => void;
}) {
    // Mark as unchecked if this item is in the filter list
    const filterListIndex: number = React.useMemo(() => {
        return filterList[filterType].indexOf(filterItem.value);
    }, [filterList, filterItem.value, filterType]);

    return (
        <FormControlLabel
            control={
                <Checkbox
                    checked={filterListIndex === -1}
                    onChange={() => {
                        const newFilterList = { ...filterList };
                        if (filterListIndex === -1) {
                            // Add to filter list
                            newFilterList[filterType].push(filterItem.value);
                        } else {
                            // Remove from filter list
                            newFilterList[filterType].splice(filterListIndex, 1);
                        }
                        setFilterList(newFilterList);
                    }}
                />
            }
            label={filterItem.label}
        />
    );
}
