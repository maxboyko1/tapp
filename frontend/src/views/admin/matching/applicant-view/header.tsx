import React from "react";
import classNames from "classnames";
import { useSelector } from "react-redux";
import {
    IconButton,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
} from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import TableChartIcon from "@mui/icons-material/TableChart";
import ViewModuleIcon from "@mui/icons-material/ViewModule";

import { useThunkDispatch } from "../../../../libs/thunk-dispatch";
import { setApplicantViewMode, applicantViewModeSelector } from "../actions";
import { SortBar } from "../sorts";
import { SortListItem } from "../sorts/sorts";
import { FilterModal } from "../filters";
import { FilterType } from "../filters/filters";
import { PositionSummary } from "../types";

/**
 * The header of the applicant view containing a search bar, filter button,
 * sort bar, and toggle button group for switching between grid/table view.
 */
export function ApplicantViewHeader({
    positionSummary,
    setFilterString,
    filterList,
    setFilterList,
    sortList,
    setSortList,
}: {
    positionSummary: PositionSummary | null;
    setFilterString: (arg0: string) => void;
    filterList: Record<FilterType, any[]>;
    setFilterList: (arg0: Record<FilterType, any[]>) => void;
    sortList: SortListItem[];
    setSortList: (arg0: SortListItem[]) => void;
}) {
    return (
        <div className="matching-course-header">
            <div className="search-container">
                <div className="form-inline">
                    <TextField
                        className="search-bar"
                        size="small"
                        variant="outlined"
                        placeholder="Filter by name/UTORid..."
                        onChange={(e) => setFilterString(e.target.value)}
                        InputProps={{
                            sx: { minWidth: 250, mr: 2 },
                        }}
                    />
                </div>
                <ApplicantFilterButton
                    filterList={filterList}
                    setFilterList={setFilterList}
                />
                <SortBar sortList={sortList} setSortList={setSortList} />
                <div className="container-filler"></div>
                <DisplayToggle />
            </div>
            <h2>{positionSummary?.position.position_code}</h2>
        </div>
    );
}

/**
 * A pair of buttons to toggle between viewing applicant information in grid or table view.
 */
function DisplayToggle() {
    const dispatch = useThunkDispatch();
    const applicantViewMode = useSelector(applicantViewModeSelector);

    return (
        <ToggleButtonGroup
            exclusive
            value={applicantViewMode}
            onChange={(_, value) => {
                if (value !== null) {
                    dispatch(setApplicantViewMode(value));
                }
            }}
            aria-label="view mode"
            size="small"
        >
            <ToggleButton
                id="view-toggle-grid"
                className="no-highlight"
                value="grid"
                aria-label="grid view"
            >
                <ViewModuleIcon />
            </ToggleButton>
            <ToggleButton
                id="view-toggle-table"
                className="no-highlight"
                value="table"
                aria-label="table view"
            >
                <TableChartIcon />
            </ToggleButton>
        </ToggleButtonGroup>
    );
}

/**
 * A button that displays a modal for filtering applicants by certain values.
 */
function ApplicantFilterButton({
    filterList,
    setFilterList,
}: {
    filterList: Record<FilterType, any[]>;
    setFilterList: (arg0: Record<FilterType, any[]>) => void;
}) {
    const [show, setShow] = React.useState(false);
    const numActiveFilters: number = React.useMemo(() => {
        let count = 0;
        for (const filterType in filterList) {
            count += filterList[filterType as FilterType].length;
        }
        return count;
    }, [filterList]);

    return (
        <>
            <div className="filter-button-container">
                <IconButton
                    className={classNames("filter-button", {
                        active: numActiveFilters > 0,
                    })}
                    onClick={() => setShow(!show)}
                    title="Filter applicants"
                    color={numActiveFilters > 0 ? "primary" : "default"}
                    size="large"
                >
                    <FilterListIcon />
                </IconButton>
            </div>
            <FilterModal
                showFilters={show}
                setShowFilters={setShow}
                filterList={filterList}
                setFilterList={setFilterList}
            />
        </>
    );
}
