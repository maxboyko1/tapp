import React from "react";
import { useSelector } from "react-redux";
import {
    applicantMatchingDataSelector,
    upsertApplicant,
    upsertApplicantMatchingDatum,
} from "../../../api/actions";
import { EditableField } from "../../../components/edit-field-widgets";
import { guaranteeTableSelector, setSelectedRows } from "./actions";
import { AdvancedFilterTable } from "../../../components/filter-table/advanced-filter-table";
import { useThunkDispatch } from "../../../libs/thunk-dispatch";
import { CellProps } from "react-table";
import { Applicant, ApplicantMatchingDatum } from "../../../api/defs/types";
import { PropsForElement } from "../../../api/defs/types/react";

/**
 * A cell that renders editable appointment guarantee information.
 */
export function GuaranteeCell(
    props: CellProps<ApplicantMatchingDatum> & {
        field: keyof ApplicantMatchingDatum;
        upsertApplicantMatchingDatum: (
            applicantMatchingDatum: Partial<ApplicantMatchingDatum>
        ) => any;
        editable: boolean;
    }
) {
    const title = `Edit ${"" + props.column.Header}`;
    const { upsertApplicantMatchingDatum, field, editable } = props;
    const applicantMatchingDatum = props.row.original;

    async function onChange(newVal: ApplicantMatchingDatum[typeof field]) {
        return await upsertApplicantMatchingDatum({
            applicant: applicantMatchingDatum.applicant,
            session: applicantMatchingDatum.session,
            [field]: newVal,
        });
    }

    return (
        <EditableField
            title={title}
            value={props.value || ""}
            onChange={onChange}
            editable={editable}
        >
            {props.value}
        </EditableField>
    );
}

/**
 * A cell that renders editable applicant information. This component is expected
 * to be passed an **ApplicantMatchingDatum**. It will read the applicant from the
 * applicant matching datum.
 */
export function ApplicantCell(
    props: CellProps<ApplicantMatchingDatum> & {
        field: keyof Applicant;
        upsertApplicant: (applicant: Partial<Applicant>) => any;
        editable: boolean;
    }
) {
    const title = `Edit ${"" + props.column.Header}`;
    const { upsertApplicant, field, editable } = props;
    const applicant = props.row.original;

    async function onChange(newVal: Applicant[typeof field]) {
        const applicantId = applicant.applicant.id;
        return await upsertApplicant({ id: applicantId, [field]: newVal });
    }

    return (
        <EditableField
            title={title}
            value={props.value || ""}
            onChange={onChange}
            editable={editable}
        >
            {props.value}
        </EditableField>
    );
}

export function ConnectedGuaranteeTable({
    editable = true,
    ...rest
}: { editable?: boolean } & Partial<
    PropsForElement<typeof AdvancedFilterTable>
>) {
    const dispatch = useThunkDispatch();
    const setSelected = React.useCallback(
        (rows: number[]) => dispatch(setSelectedRows(rows)),
        [dispatch]
    );
    const selected = useSelector(
        guaranteeTableSelector
    ).selectedApplicantMatchingDatumIds;
    const applicantMatchingData = useSelector(applicantMatchingDataSelector);
    const data = React.useMemo(() => {
        return (
            applicantMatchingData.filter((applicantMatchingDatum) => {
                return applicantMatchingDatum.min_hours_owed !== null;
            }) || []
        );
    }, [applicantMatchingData]);

    // We want to minimize the re-render of the table. Since some bindings for columns
    // are generated on-the-fly, memoize the result so we don't trigger unneeded re-renders.
    const columns = React.useMemo(() => {
        // Bind an `ApplicantCell` to a particular field
        function generateApplicantCell(field: keyof Applicant) {
            return (props: CellProps<ApplicantMatchingDatum>) => (
                <ApplicantCell
                    field={field}
                    upsertApplicant={(applicant: Partial<Applicant>) =>
                        dispatch(upsertApplicant(applicant))
                    }
                    editable={editable}
                    {...props}
                />
            );
        }

        // Bind an `GuaranteeCell` to a particular field
        function generateGuaranteeCell(field: keyof ApplicantMatchingDatum) {
            return (props: CellProps<ApplicantMatchingDatum>) => (
                <GuaranteeCell
                    field={field}
                    upsertApplicantMatchingDatum={(
                        applicantMatchingDatum: Partial<ApplicantMatchingDatum>
                    ) =>
                        dispatch(
                            upsertApplicantMatchingDatum(applicantMatchingDatum)
                        )
                    }
                    editable={editable}
                    {...props}
                />
            );
        }

        return [
            {
                Header: "Last Name",
                accessor: "applicant.last_name",
                Cell: generateApplicantCell("last_name"),
            },
            {
                Header: "First Name",
                accessor: "applicant.first_name",
                Cell: generateApplicantCell("first_name"),
            },
            {
                Header: "Email",
                accessor: "applicant.email",
                Cell: generateApplicantCell("email"),
            },
            {
                Header: "Student Number",
                accessor: "applicant.student_number",
                Cell: generateApplicantCell("student_number"),
            },
            {
                Header: "Min. Hours Owed",
                accessor: "min_hours_owed",
                className: "number-cell",
                maxWidth: 70,
                Cell: generateGuaranteeCell("min_hours_owed"),
            },
            {
                Header: "Max. Hours Owed",
                accessor: "max_hours_owed",
                className: "number-cell",
                maxWidth: 70,
                Cell: generateGuaranteeCell("max_hours_owed"),
            },
            {
                Header: "Prev. Hours Fulfilled",
                accessor: "prev_hours_fulfilled",
                className: "number-cell",
                maxWidth: 70,
                Cell: generateGuaranteeCell("prev_hours_fulfilled"),
            },
        ];
    }, [dispatch, editable]);

    return (
        <AdvancedFilterTable
            filterable={true}
            columns={columns}
            data={data}
            selected={selected}
            setSelected={setSelected}
            {...rest}
        />
    );
}
