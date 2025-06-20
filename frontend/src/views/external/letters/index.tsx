import React from "react";
import {
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useParams } from "react-router-dom";
import { RawConfirmation } from "../../../api/defs/types";
import { apiGET, apiPOST } from "../../../libs/api-utils";

import "./view-confirmation.css";

function capitalize(text: string) {
    return text
        .split(/\s+/)
        .map((word) => word.charAt(0).toLocaleUpperCase() + word.slice(1))
        .join(" ");
}

export default function LetterView() {
    const params = useParams<{ url_token?: string }>();
    const url_token = params?.url_token;
    const [confirmation, setConfirmation] = React.useState<RawConfirmation | null>(null);
    const [decision, setDecision] = React.useState<"accept" | "reject" | null>(
        null
    );
    const [signature, setSignature] = React.useState("");
    const [confirmDialogVisible, setConfirmDialogVisible] =
        React.useState(false);
    const [waiting, setWaiting] = React.useState(false);

    // If the appointment confirmation's status has been set to accepted/rejected/withdrawn,
    // no further interaction with the appointment confirmation is permitted.
    const frozen = ["accepted", "rejected", "withdrawn"].includes(
        confirmation?.status || ""
    );

    React.useEffect(() => {
        async function fetchConfirmation() {
            try {
                const details: RawConfirmation | null = await apiGET(
                    `/external/letters/${url_token}/details`,
                    true
                );
                setConfirmation(details);
            } catch (e) {
                console.warn(e);
            }
        }
        fetchConfirmation();
    }, [setConfirmation, url_token]);

    async function submitDecision() {
        if (decision == null) {
            throw new Error("Cannot submit a `null` decision");
        }
        const data = { decision, signature: signature || null };
        await apiPOST(`/external/letters/${url_token}/${decision}`, data, true);
    }
    async function confirmClicked() {
        setWaiting(true);
        await submitDecision();
        setWaiting(false);
        // @ts-expect-error deprecated but necessary for legacy browser support
        window.location.reload(true);
    }

    if (url_token == null) {
        return <React.Fragment>Unknown URL token.</React.Fragment>;
    }

    if (confirmation == null) {
        return <React.Fragment>Loading...</React.Fragment>;
    }

    const status = confirmation.status;

    return (
        <div className="letter-page">
            <div className="header">
                <h1>Letter of Confirmation of TA Appointment in Upcoming Fall/Winter Term</h1>
            </div>
            <div className="content">
                <div className="decision">
                    <h3>
                        <Button
                            component="a"
                            href={`/external/letters/${url_token}.pdf`}
                            target="_blank"
                            rel="noopener"
                            variant="contained"
                        >
                            Download PDF
                        </Button>
                    </h3>
                    <h1>
                        Status:
                        <span className={`${status} capitalize`}>
                            {" "}
                            {capitalize(status)}
                        </span>
                    </h1>
                    <form id="decision">
                        <h3>
                            I hereby confirm that I intend to take up TA appointment hours
                            in the upcoming Fall/Winter term:
                        </h3>
                        <div className="decision-container">
                            <input
                                checked={decision === "accept"}
                                onChange={() => setDecision("accept")}
                                type="radio"
                                value="accept"
                                id="radio-accept"
                                name="decision"
                                disabled={frozen}
                            />
                            <label htmlFor="radio-accept">Accept</label>
                            <input
                                checked={decision === "reject"}
                                onChange={() => setDecision("reject")}
                                type="radio"
                                value="reject"
                                id="radio-reject"
                                name="decision"
                                disabled={frozen}
                            />
                            <label htmlFor="radio-reject">Reject</label>
                            <div className="signature">
                                <div>
                                    <label htmlFor="signature_name">
                                        <p>
                                            To confirm your participation, type your
                                            initials:
                                        </p>
                                    </label>
                                    <input
                                        type="text"
                                        name="signature_name"
                                        id="signature_name"
                                        maxLength={300}
                                        value={signature}
                                        onChange={(e) =>
                                            setSignature(e.target.value)
                                        }
                                    />
                                    <div className="input-placeholder">.</div>
                                </div>
                            </div>
                            <Button
                                variant="contained"
                                disabled={
                                    decision == null ||
                                    (decision === "accept" && signature === "")
                                }
                                title={
                                    decision == null
                                        ? "You must choose to accept or reject the offer in order to submit"
                                        : decision === "accept" &&
                                          signature === ""
                                        ? "You must sign your name to accept the offer"
                                        : "Submit your decision"
                                }
                                onClick={() =>
                                    setConfirmDialogVisible(true)
                                }
                            >
                                Submit
                            </Button>
                        </div>
                    </form>
                </div>
                <div className="letter-view">
                    <iframe
                        title="Letter"
                        src={`/external/letters/${url_token}`}
                    ></iframe>
                </div>
            </div>
            <Dialog
                open={confirmDialogVisible}
                onClose={() => setConfirmDialogVisible(false)}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle sx={{ m: 0, p: 2 }}>
                    {capitalize(decision || "")} Participation
                    <IconButton
                        aria-label="close"
                        onClick={() => setConfirmDialogVisible(false)}
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
                    Are you sure you want to <b>{decision}</b> your participation
                    in the upcoming Fall/Winter term?
                </DialogContent>
                <DialogActions>
                    <Button
                        variant="outlined"
                        onClick={() => setConfirmDialogVisible(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={confirmClicked}
                        disabled={waiting}
                        startIcon={waiting ? <CircularProgress size={18} /> : null}
                    >
                        {capitalize(decision || "")} Offer
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}
