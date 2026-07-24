import React from "react";
import {
	Alert,
	Box,
	Button,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import { Position } from "../../../api/defs/types";
import { compareString } from "../../../libs/utils";
import { PositionsList } from "../../../components/positions-list";

function comparePosition(a: Position, b: Position) {
	return compareString(a.position_code || "", b.position_code || "");
}

export function PositionConfirmationDialog(props: {
	selectedPositions: Position[];
	visible: boolean;
	setVisible: (visible: boolean) => void;
	callback: () => Promise<any> | void;
	title: string;
	body: string;
	confirmation: string;
}) {
	const {
		selectedPositions,
		visible,
		setVisible,
		callback,
		title,
		body,
		confirmation,
	} = props;

	const [inProgress, setInProgress] = React.useState(false);

	async function executeCallback() {
		setInProgress(true);
		await callback();
		setInProgress(false);
		setVisible(false);
	}

	const spinner = inProgress ? (
		<CircularProgress size={20} sx={{ mr: 1 }} />
	) : null;

	const sortedPositions = [...selectedPositions].sort(comparePosition);

	return (
		<Dialog open={visible} onClose={() => setVisible(false)} maxWidth="lg" fullWidth>
			<DialogTitle sx={{ m: 0, p: 2 }}>
				{title}
				<IconButton
					aria-label="close"
					onClick={() => setVisible(false)}
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
				<Box mb={3}>
					<Alert severity="info">{body}</Alert>
				</Box>
				<Box mb={3}>
					<PositionsList positions={sortedPositions} />
				</Box>
			</DialogContent>
			<DialogActions>
				<Button
					onClick={() => setVisible(false)}
					variant="contained"
					color="secondary"
				>
					Cancel
				</Button>
				<Button
					onClick={executeCallback}
					variant="contained"
					color="primary"
					disabled={inProgress}
				>
					{spinner}
					{confirmation}
				</Button>
			</DialogActions>
		</Dialog>
	);
}
