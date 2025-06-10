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
import { RawOffer } from "../../../api/defs/types";
import { apiGET, apiPOST } from "../../../libs/api-utils";

import "./view-offer.css";

function capitalize(text: string) {
    return text
        .split(/\s+/)
        .map((word) => word.charAt(0).toLocaleUpperCase() + word.slice(1))
        .join(" ");
}

export default function ContractView() {
    const params = useParams<{ url_token?: string }>();
    const url_token = params?.url_token;
    const [offer, setOffer] = React.useState<RawOffer | null>(null);
    const [decision, setDecision] = React.useState<"accept" | "reject" | null>(
        null
    );
    const [signature, setSignature] = React.useState("");
    const [confirmationDialogVisible, setConfirmationDialogVisible] =
        React.useState(false);
    const [waiting, setWaiting] = React.useState(false);

    // If the offer's status has been set to accepted/rejected/withdrawn,
    // no further interaction with the offer is permitted.
    const frozen = ["accepted", "rejected", "withdrawn"].includes(
        offer?.status || ""
    );

    React.useEffect(() => {
        async function fetchOffer() {
            try {
                const details: RawOffer | null = await apiGET(
                    `/external/contracts/${url_token}/details`,
                    true
                );
                setOffer(details);
            } catch (e) {
                console.warn(e);
            }
        }
        fetchOffer();
    }, [setOffer, url_token]);

    async function submitDecision() {
        if (decision == null) {
            throw new Error("Cannot submit a `null` decision");
        }
        const data = { decision, signature: signature || null };
        await apiPOST(`/external/contracts/${url_token}/${decision}`, data, true);
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

    if (offer == null) {
        return <React.Fragment>Loading...</React.Fragment>;
    }

    const position_code = offer.position_code;
    const status = offer.status;

    return (
        <div className="contract-page">
            <div className="header">
                <h1>Offer of Teaching Assistantship for {position_code}</h1>
            </div>
            <div className="content">
                <div className="decision">
                    <h3>
                        <Button
                            component="a"
                            href={`/external/contracts/${url_token}.pdf`}
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
                            I hereby accept the Teaching Assistantship position
                            offered:
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
                                            I confirm that I will be registered
                                            as a University of Toronto student
                                            or PDF on the date that this
                                            appointment begins. I understand
                                            that if I should cease to be
                                            registered as a University of
                                            Toronto student or PDF during the
                                            period of this appointment, for any
                                            reason other than convocation, I
                                            must immediately notify my
                                            supervisor, and my appointment may
                                            be terminated.
                                        </p>
                                        <p>
                                            To accept this contract, type your
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
                                        ? "You must choose to accept or reject the contract in order to submit"
                                        : decision === "accept" &&
                                          signature === ""
                                        ? "You must sign your name to accept the offer"
                                        : "Submit your decision"
                                }
                                onClick={() =>
                                    setConfirmationDialogVisible(true)
                                }
                            >
                                Submit
                            </Button>
                        </div>
                    </form>
                    <div className="admonishment">
                        <p>
                            <b>Important:</b> In order to arrange payroll, if
                            this is your first TA-ship or your SIN number has
                            been changed since your last TA-ship, you must
                            supply the department office with appropriate
                            documentation.
                        </p>
                    </div>
                </div>
                <div className="contract-view">
                    <iframe
                        title="Contract"
                        src={`/external/contracts/${url_token}`}
                    ></iframe>
                </div>
            </div>
            <Dialog
                open={confirmationDialogVisible}
                onClose={() => setConfirmationDialogVisible(false)}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle sx={{ m: 0, p: 2 }}>
                    {capitalize(decision || "")} Offer
                    <IconButton
                        aria-label="close"
                        onClick={() => setConfirmationDialogVisible(false)}
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
                    Are you sure you want to <b>{decision}</b> the TA-ship for this offer?
                </DialogContent>
                <DialogActions>
                    <Button
                        variant="outlined"
                        onClick={() => setConfirmationDialogVisible(false)}
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
