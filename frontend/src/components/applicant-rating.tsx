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
    "1": "secondary.main",
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
    const [draftComment, setDraftComment] = React.useState(comment || "");

    // When opening the dialog, set the draft to the current comment
    const handleOpenDialog = () => {
        setDraftComment(comment || "");
        setEditDialogShow(true);
    };

    const handleSaveComment = () => {
        setComment(draftComment);
        setEditDialogShow(false);
    };

    let widget = null;
    if (compact) {
        widget = (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {[2, 1, 0, -1].map((r) => (
                    <Tooltip key={r} title={RATING_TO_DESCRIPTION[String(r)]}>
                        <span>
                            <DisplayRating
                                rating={r}
                                onClick={() => setRating(r)}
                                aria-label={RATING_TO_DESCRIPTION[String(r)]}
                                active={rating === r}
                            />
                        </span>
                    </Tooltip>
                ))}
                <IconButton onClick={handleOpenDialog} size="small">
                    <CommentIcon fontSize="small" />
                </IconButton>
                {comment && (
                    <Typography variant="caption" sx={{ ml: 1, color: "primary.main" }}>
                        {comment}
                    </Typography>
                )}
            </Box>
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
                        value={draftComment}
                        onChange={(e) => setDraftComment(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditDialogShow(false)}>Cancel</Button>
                    <Button
                        onClick={handleSaveComment}
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
                <Typography variant="caption" sx={{ ml: 1 }}>
                    {RATING_TO_DESCRIPTION["" + rating]}
                </Typography>
            </Box>
        </Button>
    );
}

/**
 * Display the rating icon.
 */
export function DisplayRating({
    rating,
    onClick,
    "aria-label": ariaLabel,
    active = true,
}: {
    rating: number | null;
    onClick?: () => void;
    "aria-label"?: string;
    active?: boolean;
}) {
    const clampedRating =
        rating == null ? null : Math.max(Math.min(rating, 2), -1);
    const key = String(clampedRating);
    const bgcolor = RATING_TO_BG_COLOR[key] || "grey.200";
    const symbol = {
        "-1": "-",
        "0": "?",
        "1": "+",
        "2": "++",
    }[key] ?? "?";

    return (
        <IconButton
            size="small"
            onClick={onClick}
            aria-label={ariaLabel || `Rating ${symbol}`}
            sx={{
                p: 0,
                borderRadius: 1,
                bgcolor: active ? bgcolor : "transparent",
                color: active ? "white" : bgcolor,
                border: active ? `2px solid ${bgcolor}` : `2px solid ${bgcolor}`,
                opacity: active ? 1 : 0.5,
                fontWeight: "bold",
                minWidth: 20,
                minHeight: 20,
                width: 20,
                height: 20,
                "&:hover": {
                    bgcolor,
                    opacity: 0.85,
                },
            }}
        >
            <Box
                sx={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "bold",
                    fontSize: 12,
                }}
            >
                {symbol}
            </Box>
        </IconButton>
    );
}