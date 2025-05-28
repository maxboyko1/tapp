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
import { RawDdahDetails } from "../../../api/defs/types";
import { apiGET, apiPOST } from "../../../libs/api-utils";

import "./view-ddah.css";

function capitalize(text: string) {
    return text
        .split(/\s+/)
        .map((word) => word.charAt(0).toLocaleUpperCase() + word.slice(1))
        .join(" ");
}

export function DdahView() {
    const params = useParams<{ url_token?: string }>();
    const url_token = params?.url_token;
    const [ddah, setDdah] = React.useState<RawDdahDetails | null>(null);
    const [decision, setDecision] = React.useState<"accept" | null>(null);
    const [signature, setSignature] = React.useState("");
    const [confirmationDialogVisible, setConfirmationDialogVisible] =
        React.useState(false);
    const [waiting, setWaiting] = React.useState(false);

    // If the offer's status has been set to accepted/rejected/withdrawn,
    // no further interaction with the offer is permitted.
    const frozen = ["acknowledged"].includes(ddah?.status || "");

    React.useEffect(() => {
        async function fetchOffer() {
            try {
                const details: RawDdahDetails | null = await apiGET(
                    `/public/ddahs/${url_token}/details`,
                    true
                );
                setDdah(details);
            } catch (e) {
                console.warn(e);
            }
        }
        fetchOffer();
    }, [setDdah, url_token]);

    async function submitDecision() {
        if (decision == null) {
            throw new Error("Cannot submit a `null` decision");
        }
        const data = { decision, signature: signature || null };
        await apiPOST(`/public/ddahs/${url_token}/${decision}`, data, true);
    }
    async function confirmClicked() {
        setWaiting(true);
        await submitDecision();
        setWaiting(false);
        // @ts-ignore
        window.location.reload(true);
    }

    if (url_token == null) {
        return <React.Fragment>Unknown URL token.</React.Fragment>;
    }

    if (ddah == null) {
        return <React.Fragment>Loading...</React.Fragment>;
    }

    const position_code = ddah.position_code;
    const status = ddah.status;

    return (
        <div className="contract-page">
            <div className="header">
                <h1>
                    Description of Duties and Allocation of Hours for{" "}
                    {position_code}
                </h1>
            </div>
            <div className="content">
                <div className="decision">
                    <h3>
                        <Button
                            component="a"
                            href={`/public/ddahs/${url_token}.pdf`}
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
                            Please acknowledge receipt of this Description of
                            Duties and Allocation of Hours form below. If there
                            are any issues with your described duties or you
                            need further clarification, please contact your
                            course supervisor(s).
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
                            <label htmlFor="radio-accept">Acknowledge</label>
                            <div className="signature">
                                <div>
                                    <label htmlFor="signature_name">
                                        <p>
                                            To confirm your acknowledgement,
                                            please type your name below.
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
                    <div className="admonishment"></div>
                </div>
                <div className="contract-view">
                    <iframe
                        title="Contract"
                        src={`/public/ddahs/${url_token}`}
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
                    Acknowledge DDAH
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
                    Are you sure you want to <b>acknowledge</b> the DDAH?
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
                        Acknowledge DDAH
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}
