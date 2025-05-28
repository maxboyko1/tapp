import React from "react";
import { InstructorPreference } from "../api/defs/types";
import { 
    Box,
    Button,
    ButtonGroup,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Stack,
    TextField,
    Tooltip,
    Typography
} from "@mui/material";
import CommentIcon from "@mui/icons-material/Comment";
import CommentOutlineIcon from "@mui/icons-material/CommentOutlined";

const RATING_TO_BG_COLOR: Record<string, string> = {
    null: "grey.200",
    "-1": "error.main",
    "0": "grey.500",
    "1": "primary.main",
    "2": "success.main",
};

const RATING_TO_DESCRIPTION: Record<string, string> = {
    null: "Unknown",
    "-1": "Not Suitable",
    "0": "Unknown",
    "1": "Suitable",
    "2": "Strongly Preferred",
};

export function ApplicantRating({
    rating,
    onChange,
}: {
    rating: number | null;
    onChange?: Function;
}) {
    const clampedRating =
        rating == null ? null : Math.max(Math.min(rating, 2), -1);
    const setRating = (r: number) => onChange?.(r);

    const buttons = [
        {
            value: 2,
            label: "+",
            title: "Outstanding TA",
        },
        {
            value: 1,
            label: "+",
            title: "Good TA",
        },
        {
            value: 0,
            label: "?",
            title: "Neutral / Not enough info",
        },
        {
            value: -1,
            label: "-",
            title: "Not suitable",
        },
    ]

    return (
        <ButtonGroup aria-label="Applicant Rating" size="small">
            {buttons.map(({ value, label, title }) => (
                <Tooltip key={value} title={title}>
                    <Button
                        variant={clampedRating === value ? "contained" : "outlined"}
                        onClick={() => setRating(value)}
                    >
                        {label}
                    </Button>
                </Tooltip>
            ))}
        </ButtonGroup>
    );
}

export function ApplicantComment({
    comment,
    onClick
}: {
    comment: null | string;
    onClick?: () => void;
}) {
    const handleClick = () => onClick?.();

    return (
        <Button
            onClick={handleClick}
            variant="outlined"
            size="small"
            startIcon={comment ? <CommentIcon /> : <CommentOutlineIcon />}
            sx={{ textTransform: "none" }}
        >
            {comment ? (
                <Typography variant="body2" noWrap>
                    {comment}
                </Typography>
            ) : (
                "Add Comment"
            )}
        </Button>
    )
}

export function ApplicantRatingAndComment({
    instructorPreference,
    setInstructorPreference,
    compact = true,
}: {
    instructorPreference: InstructorPreference | null;
    setInstructorPreference?: Function;
    compact?: boolean;
}) {
    const rating = instructorPreference?.preference_level ?? null;
    const comment = instructorPreference?.comment || null;
    const setRating = React.useCallback(
        (rating: number) => {
            if (setInstructorPreference) {
                return setInstructorPreference({
                    ...(instructorPreference || {}),
                    preference_level:
                        rating === instructorPreference?.preference_level
                            ? null
                            : rating,
                });
            }
        },
        [setInstructorPreference, instructorPreference]
    );
    const setComment = React.useCallback(
        (comment: string | null) => {
            const trimmedComment =
                comment != null ? comment.trim() || null : null;
            if (setInstructorPreference) {
                return setInstructorPreference({
                    ...(instructorPreference || {}),
                    comment: trimmedComment,
                });
            }
        },
        [setInstructorPreference, instructorPreference]
    );
    const [editDialogShow, setEditDialogShow] = React.useState(false);

    let widget = null;
    if (compact) {
        widget = (
            <React.Fragment>
                <ApplicantRating rating={rating} onChange={setRating} />
                <IconButton onClick={() => setEditDialogShow(true)} size="small">
                    <CommentIcon fontSize="small" />
                </IconButton>
                {comment && (
                    <Typography variant="caption" sx={{ ml: 1 }}>
                        {comment}
                    </Typography>
                )}
            </React.Fragment>
        );
    } else {
        widget = (
            <Stack direction="row" spacing={2}>
                <Stack spacing={1}>
                    {[2, 1, 0, -1].map((r) => (
                        <LargeRatingButton
                            key={r}
                            rating={r}
                            activeRating={rating}
                            onClick={() => setRating(r)}
                        />
                    ))}
                </Stack>
                <Stack spacing={1}>
                    <Button
                        variant="outlined"
                        onClick={() => setEditDialogShow(true)}
                        startIcon={<CommentIcon />}
                    >
                        Edit Comment
                    </Button>
                    <Typography variant="body2">
                        {comment ? (
                            <>
                                <strong>Comment:</strong> {comment}
                            </>
                        ) : (
                            <i>No Comment</i>
                        )}
                    </Typography>
                </Stack>
            </Stack>
        );
    }

    return (
        <Box
            className="applicant-rating-container"
            sx={{
            display: "flex",
            flexDirection: compact ? "row" : "column",
            alignItems: compact ? "center" : "flex-start",
            gap: 1,
            }}
        >
            {widget}
            <Dialog
                open={editDialogShow}
                onClose={() => setEditDialogShow(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Edit Comment</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Comment"
                        type="text"
                        fullWidth
                        multiline
                        minRows={3}
                        value={comment || ""}
                        onChange={(e) => setComment(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditDialogShow(false)}>Cancel</Button>
                    <Button
                        onClick={() => setEditDialogShow(false)}
                        variant="contained"
                    >
                        Save
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

function LargeRatingButton({
    onClick,
    rating,
    activeRating,
}: {
    rating: number | null;
    activeRating: number | null;
    onClick?: () => void;
}) {
    const clampedRating =
        activeRating == null ? null : Math.max(Math.min(activeRating, 2), -1);
    const isActive = clampedRating === rating;

    return (
        <Button
            variant={isActive ? "contained" : "outlined"}
            color={isActive ? "primary" : "inherit"}
            onClick={onClick}
            fullWidth
            sx={{ py: 1 }}
        >
            <Box>
                <DisplayRating rating={rating} />
                <Typography variant="caption">
                    {RATING_TO_DESCRIPTION["" + rating]}
                </Typography>
            </Box>
        </Button>
    );
}

/**
 * Display the rating icon but not as a button.
 */
export function DisplayRating({ rating }: { rating: number | null }) {
    const clampedRating =
        rating == null ? null : Math.max(Math.min(rating, 2), -1);
    const key = String(clampedRating);
    const bgColor = RATING_TO_BG_COLOR[key] || "grey.200";;
    const symbol = {
        "-1": "-",
        "0": "?",
        "1": "+",
        "2": "++",
    }[key] ?? "?";

    return (
        <Box
            sx={{
                display: "inline-block",
                px: 1,
                py: 0.5,
                borderRadius: 1,
                bgColor: bgColor,
                color: "white",
                fontWeight: "bold",
                textAlign: "center",
                minWidth: 24,
            }}
        >
            {symbol}
        </Box>
    )
}
