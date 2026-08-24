import React from "react";
import {
	Alert,
	Button,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	IconButton,
	Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import { useSelector } from "react-redux";
import { activeSessionSelector, upsertSession } from "../../../api/actions";
import { Duty, Session } from "../../../api/defs/types";
import { DutyListEditor } from "../../../components/ddahs";
import { useThunkDispatch } from "../../../libs/thunk-dispatch";

/**
 * Build the initial list of fixed duties based on the session's DDAH outline.
 * @param session 
 * @returns 
 */
function toOutlineDuties(session: Session | null): Duty[] {
	if (!session?.ddah_outline) {
		return [];
	}
	return session.ddah_outline.map((outlineDuty, idx) => ({
		...outlineDuty,
		order: idx + 1,
		is_fixed: true,
	}));
}

export function ConnectedEditDdahOutlineDialog(props: {
	show: boolean;
	onHide?: (...args: any) => any;
}) {
	const { show, onHide = () => {} } = props;
	const activeSession = useSelector(activeSessionSelector);
	const dispatch = useThunkDispatch();

	const [outlineDuties, setOutlineDuties] = React.useState<Duty[]>([]);
	const [inProgress, setInProgress] = React.useState(false);
	const [saveError, setSaveError] = React.useState<string>("");

	React.useEffect(() => {
		if (!show) {
			setSaveError("");
			setOutlineDuties([]);
			return;
		}

		setSaveError("");
		setOutlineDuties(toOutlineDuties(activeSession));
	}, [show, activeSession]);

	async function saveDdahOutline() {
		if (!activeSession) {
			return;
		}

		setInProgress(true);
		setSaveError("");

		try {
			await dispatch(
				upsertSession({
					id: activeSession.id,
					ddah_outline: outlineDuties
						.slice()
						.sort((a, b) => a.order - b.order)
						.map((duty) => ({
							hours: duty.hours,
							description: duty.description,
						})),
				})
			);
			onHide();
		} catch (e: any) {
			setSaveError(
				e?.message || "Failed to save the DDAH outline. Please try again."
			);
		} finally {
			setInProgress(false);
		}
	}

	const totalFixedHours = outlineDuties.reduce(
		(sum, duty) => sum + duty.hours,
		0
	);

	const spinner = inProgress ? (
		<CircularProgress size={18} sx={{ mr: 1 }} />
	) : null;

	return (
		<Dialog open={show} onClose={onHide} maxWidth="lg" fullWidth>
			<DialogTitle sx={{ m: 0, p: 2 }}>
				Edit DDAH Outline for {activeSession?.name || "the active session"}
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
			<DialogContent dividers>
				<Typography variant="body2" sx={{ mb: 2 }}>
					Define the duties that should appear by default as fixed, uneditable items
					in newly created DDAHs for the active session.
				</Typography>
				<DutyListEditor
					duties={outlineDuties}
					setDuties={setOutlineDuties}
					newDutyIsFixed={true}
				/>
				<Typography variant="body2" sx={{ mt: 1 }}>
					{totalFixedHours} fixed hours allocated
				</Typography>
				{saveError ? (
					<Alert severity="error" sx={{ mt: 2 }}>
						{saveError}
					</Alert>
				) : null}
			</DialogContent>
			<DialogActions>
				<Button onClick={onHide} variant="contained" color="secondary">
					Cancel
				</Button>
				<Button
					onClick={saveDdahOutline}
					title="Save DDAH Outline"
					disabled={inProgress || !activeSession}
					variant="contained"
					color="primary"
					startIcon={spinner}
				>
					Save
				</Button>
			</DialogActions>
		</Dialog>
	);
}
