import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import { Application } from "../../../../api/defs/types";
import { ApplicationDetails } from "../../applications/application-details";

/**
 * A modal window displaying detailed information about an application.
 */
export function ApplicationDetailModal({
    application,
    setShownApplication,
}: {
    application: Application | null;
    setShownApplication: (application: Application | null) => void;
}) {
    if (!application) {
        return null;
    }

    return (
        <Dialog
            open={Boolean(application)}
            onClose={() => setShownApplication(null)}
            maxWidth="xl"
            fullWidth
        >
            <DialogTitle sx={{ m: 0, p: 2 }}>
                Application Details
                <IconButton
                    aria-label="close"
                    onClick={() => setShownApplication(null)}
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
                <ApplicationDetails application={application} />
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={() => setShownApplication(null)}
                    variant="outlined"
                    color="secondary"
                >
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
}
