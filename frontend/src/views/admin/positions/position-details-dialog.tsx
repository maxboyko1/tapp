import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import { useSelector } from "react-redux";
import { Position } from "../../../api/defs/types";
import { useThunkDispatch } from "../../../libs/thunk-dispatch";
import { PositionsDetails } from "./position-details";
import { selectedPositionSelector, setSelectedPosition } from "./actions";

function PositionDetailsDialog({
    position,
    visible,
    onHide,
}: {
    position: Position;
    visible: boolean;
    onHide: (...args: any[]) => any;
}) {
    return (
        <Dialog open={visible} onClose={onHide} maxWidth="lg" fullWidth>
            <DialogTitle sx={{ m: 0, p: 2 }}>
                Details for {position.position_code}
                <IconButton
                    aria-label="close"
                    onClick={onHide}
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        color: (theme) => theme.palette.grey[500],
                    }}
                    size="large"
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers>
                <PositionsDetails position={position} />
            </DialogContent>
            <DialogActions>
                <Button variant="contained" color="secondary" onClick={onHide}>
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export function ConnectedPositionDetailsDialog() {
    const selectedPosition = useSelector(selectedPositionSelector);
    const dispatch = useThunkDispatch();

    if (selectedPosition == null) {
        return null;
    }

    return (
        <PositionDetailsDialog
            visible={!!selectedPosition}
            position={selectedPosition}
            onHide={() => dispatch(setSelectedPosition(null))}
        />
    );
}
