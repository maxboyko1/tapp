import React from "react";
import { useSelector } from "react-redux";
import {
    applicantMatchingDataSelector,
    letterTemplatesSelector,
    upsertApplicant,
    upsertApplicantMatchingDatum,
} from "../../../api/actions";
import { guaranteeTableSelector, setSelectedRows } from "./actions";
import { formatDownloadUrl, capitalize, formatDate } from "../../../libs/utils";
import { AdvancedColumnDef, AdvancedFilterTable } from "../../../components/advanced-filter-table";
import { useThunkDispatch } from "../../../libs/thunk-dispatch";
import { Applicant, ApplicantMatchingDatum } from "../../../api/defs/types";
import { PropsForElement } from "../../../api/defs/types/react";
import { MRT_Row } from "material-react-table";
import { Button, Stack, Tooltip, Typography } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { generateNumberCell, generateSingleSelectColumnProps } from "../../../components/table-utils";

/**
 * Cell to show the status of a letter and offer a download button if a letter has been created.
 * I.e., a
 *
 * @param {*} { original }
 * @returns
 */
export function StatusCell({
    value,
    row 
}: {
    value: ApplicantMatchingDatum["active_confirmation_status"];
    row: MRT_Row<ApplicantMatchingDatum>;
}) {
    const formattedStatus = capitalize(value || "No Letter Sent");
    const activeConfirmationUrlToken = row.original.active_confirmation_url_token;

    return (
        <Stack direction="row" spacing={1} alignItems="center">
            {activeConfirmationUrlToken && (
                <Tooltip title="Download letter PDF">
                    <Button
                        href={formatDownloadUrl(
                            `/public/letters/${activeConfirmationUrlToken}.pdf`
                        )}
                        variant="outlined"
                        size="small"
                        target="_blank"
                        rel="noopener"
                        sx={{ minWidth: 0, padding: "2px 6px" }}
                    >
                        <SearchIcon fontSize="small" />
                    </Button>
                </Tooltip>
            )}
            <Typography variant="body2">
                {formattedStatus}
            </Typography>
        </Stack>
    );
}

export function ConnectedGuaranteeTable({
    editable = true,
    ...rest
}: { editable?: boolean } & Partial<
    PropsForElement<typeof AdvancedFilterTable>
>) {
    const dispatch = useThunkDispatch();
    const selected = useSelector(
        guaranteeTableSelector
    ).selectedApplicantMatchingDatumIds;
    const setSelected = React.useCallback(
        (rows: number[]) => {
            const filtered = rows.filter((id) => !isNaN(id));
            if (
                filtered.length !== selected.length ||
                filtered.some((id, i) => id !== selected[i])
            ) {
                dispatch(setSelectedRows(filtered));
            }
        },
        [dispatch, selected]
    );
    const applicantMatchingData = useSelector(applicantMatchingDataSelector);
    const data = React.useMemo(
        () =>
            applicantMatchingData.map((applicantMatchingDatum) => {
                const { active_confirmation_status, ...rest } = applicantMatchingDatum;
                return !active_confirmation_status
                    ? { active_confirmation_status: "No Letter Sent", ...rest }
                    : applicantMatchingDatum;
            }),
        [applicantMatchingData]
    );
    const allTemplates = useSelector(letterTemplatesSelector);

    // Row editing is blocked for assignments that have an active offer
    const editBlocked = React.useCallback((applicantMatchingDatum: ApplicantMatchingDatum) => {
        if (["pending", "rejected", "accepted"].includes(applicantMatchingDatum.active_confirmation_status || "")) {
            return `This applicant matching currently has an active appointment confirmation. You must first
                withdraw the existing appointment confirmation before making a modification.`
        }
        return false;
    }, []);

    const _upsertApplicantMatchingDatum = React.useCallback(
        (applicantMatchingDatum: Partial<ApplicantMatchingDatum>) => {
            return dispatch(upsertApplicantMatchingDatum(applicantMatchingDatum));
        },
        [dispatch]
    );

    const _upsertApplicant = React.useCallback(
        (applicant: Partial<Applicant>) => {
            return dispatch(upsertApplicant(applicant));
        },
        [dispatch]
    );

    const handleEditRow = React.useCallback(
        (original: ApplicantMatchingDatum, values: Partial<ApplicantMatchingDatum>) => {
            // Split values into applicant and appointment updates
            const applicantUpdates: Partial<Applicant> = {};
            const appointmentUpdates: Partial<ApplicantMatchingDatum> = {};

            Object.entries(values).forEach(([key, val]) => {
                if (key.startsWith("applicant.")) {
                    // Remove "applicant." prefix for applicant fields
                    applicantUpdates[key.replace("applicant.", "") as keyof Applicant] = val as any;
                } else {
                    appointmentUpdates[key as keyof ApplicantMatchingDatum] = val as any;
                }
            });

            if (Object.keys(applicantUpdates).length > 0) {
                _upsertApplicant({ ...original.applicant, ...applicantUpdates });
            }
            if (Object.keys(appointmentUpdates).length > 0) {
                _upsertApplicantMatchingDatum({ ...original, ...appointmentUpdates });
            }
        },
        [_upsertApplicantMatchingDatum, _upsertApplicant]
    );

    // We want to minimize the re-render of the table. Since some bindings for columns
    // are generated on-the-fly, memoize the result so we don't trigger unneeded re-renders.
    const columns: AdvancedColumnDef<ApplicantMatchingDatum>[] = React.useMemo(() => {
        return [
            {
                header: "Last Name",
                accessorKey: "applicant.last_name",
                meta: { editable: editable },
            },
            {
                header: "First Name",
                accessorKey: "applicant.first_name",
                meta: { editable: editable },
            },
            {
                header: "Email",
                accessorKey: "applicant.email",
                meta: { editable: editable },
            },
            {
                header: "Student Number",
                accessorKey: "applicant.student_number",
                meta: { editable: editable },
            },
            {
                header: "Min. Hours Owed",
                accessorKey: "min_hours_owed",
                meta: { editable: editable },
                maxSize: 70,
                EditCell: generateNumberCell(),
            },
            {
                header: "Max. Hours Owed",
                accessorKey: "max_hours_owed",
                meta: { editable: editable },
                maxSize: 70,
                EditCell: generateNumberCell(),
            },
            {
                header: "Prev. Hours Fulfilled",
                accessorKey: "prev_hours_fulfilled",
                meta: { editable: editable },
                maxSize: 100,
                EditCell: generateNumberCell(),
            },
            {
                header: "Letter Template",
                accessorKey: "letter_template",
                meta: { editable: editable },
                ...generateSingleSelectColumnProps({
                    options: allTemplates,
                    getLabel: (option) => option?.template_name ?? "",
                }),
            },
            {
                header: "Status",
                id: "status",
                // We want items with no active confirmation to appear at the end of the list
                // when sorted, so we set their accessor to null (the accessor is used by react table
                // when sorting items).
                accessorFn: (dat: typeof data[number]) =>
                    dat.active_confirmation_status === "No Letter Sent"
                        ? null
                        : dat.active_confirmation_status,
                Cell: ({ cell, row }) => (
                    <StatusCell
                        value={cell.getValue() as ApplicantMatchingDatum["active_confirmation_status"]}
                        row={row}
                    />
                ),
            },
            {
                header: "Last Updated",
                accessorKey: "active_confirmation_recent_activity_date",
                Cell: ({ cell }) => {
                    const date = cell.getValue();
                    return typeof date === "string" ? formatDate(date) : <></>;
                },
                maxSize: 120,
            },
            {
                header: "Nag Count",
                accessorKey: "active_confirmation_nag_count",
                // If the nag-count is 0, we don't want to show it,
                // so we return null in that case, which displays nothing.
                Cell: ({ cell }) => {
                    const value = cell.getValue();
                    return value ? <>{value}</> : null;
                },
                maxSize: 30,
            },
        ];
    }, [allTemplates, editable]);

    return (
        <AdvancedFilterTable
            filterable={true}
            columns={columns}
            data={data}
            selectable={true}
            selected={selected}
            setSelected={setSelected}
            editable={editable}
            onEditRow={handleEditRow}
            editBlocked={editBlocked}
            {...rest}
        />
    );
}
