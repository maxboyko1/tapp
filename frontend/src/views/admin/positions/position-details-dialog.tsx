import React from "react";
import { useSelector } from "react-redux";
import {
    Alert,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SavedSearchIcon from "@mui/icons-material/SavedSearch";

import { positionsSelector } from "../../../api/actions";
import { Position } from "../../../api/defs/types";
import { ActionButton } from "../../../components/action-buttons";
import { PositionsDetails } from "./position-details";
import { positionsTableSelector } from "./actions";

function PositionDetailsDialog({
    positions,
    visible,
    onHide,
}: {
    positions: Position[];
    visible: boolean;
    onHide: (...args: any[]) => any;
}) {
    const sortedPositions = [...positions].sort((a, b) => {
        const aCode = a.position_code || "";
        const bCode = b.position_code || "";
        return aCode === bCode ? 0 : aCode > bCode ? 1 : -1;
    });

    let positionDetails: React.ReactNode = (
        <Alert severity="info">
            There are no selected positions. You must select positions to see
            their details.
        </Alert>
    );

    if (sortedPositions.length > 0) {
        positionDetails = sortedPositions.map((position, i) => {
            const split = i === 0 ? null : <hr />;
            return (
                <React.Fragment key={position.id}>
                    {split}
                    <PositionsDetails position={position} />
                </React.Fragment>
            );
        });
    }

    return (
        <Dialog open={visible} onClose={onHide} maxWidth="lg" fullWidth>
            <DialogTitle sx={{ m: 0, p: 2 }}>
                Position Details
                <IconButton
                    aria-label="close"
                    onClick={onHide}
                    sx={{
                        position: "absolute",
                        right: 8,
                        top: 8,
                        color: (theme) => theme.palette.grey[500],
                    }}
                    size="large"
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers>{positionDetails}</DialogContent>
            <DialogActions>
                <Button variant="contained" color="secondary" onClick={onHide}>
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export function ConnectedPositionDetailsDialog() {
    const [dialogVisible, setDialogVisible] = React.useState(false);
    const positions = useSelector<any, Position[]>(positionsSelector);
    const { selectedPositionIds } = useSelector(positionsTableSelector);
    const selectedPositions = positions.filter((position) =>
        selectedPositionIds.includes(position.id)
    );
    const disabled = selectedPositionIds.length === 0;

    return (
        <React.Fragment>
            <ActionButton
                icon={<SavedSearchIcon />}
                onClick={() => setDialogVisible(true)}
                title={
                    disabled
                        ? "You must select a position to view details"
                        : "View details of selected position(s)"
                }
                disabled={disabled}
            >
                Position Details
            </ActionButton>
            <PositionDetailsDialog
                visible={dialogVisible}
                positions={selectedPositions}
                onHide={() => setDialogVisible(false)}
            />
        </React.Fragment>
    );
}
