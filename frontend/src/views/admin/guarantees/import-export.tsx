import React from "react";
import FileSaver from "file-saver";
import { useThunkDispatch } from "../../../libs/thunk-dispatch";
import { useSelector } from "react-redux";
import { ExportActionButton } from "../../../components/export-button";
import PropTypes from "prop-types";
import { ImportActionButton } from "../../../components/import-button";
import {
    activeSessionSelector,
    applicantMatchingDataSelector,
    applicantsSelector,
    exportApplicantMatchingData,
    upsertApplicantMatchingData,
} from "../../../api/actions";
import {
    ExportFormat,
    DataFormat,
    normalizeImport,
    prepareApplicantMatchingData,
} from "../../../libs/import-export";
import { diffImport, DiffSpec, getChanged } from "../../../libs/diffs";
import {
    ApplicantMatchingDatum,
    MinimalApplicantMatchingDatum,
} from "../../../api/defs/types";
import { applicantMatchingDatumSchema } from "../../../libs/schema";
import { Alert } from "react-bootstrap";
import { createDiffColumnsFromColumns } from "../../../components/diff-table";
import { AdvancedFilterTable } from "../../../components/filter-table/advanced-filter-table";

export function ConnectedImportAppointmentsAction() {
    const dispatch = useThunkDispatch();
    const applicantMatchingData = useSelector(applicantMatchingDataSelector);
    const applicants = useSelector(applicantsSelector);
    const session = useSelector(activeSessionSelector);

    const [fileContent, setFileContent] = React.useState<DataFormat | null>(
        null
    );
    const [diffed, setDiffed] = React.useState<
        DiffSpec<MinimalApplicantMatchingDatum, ApplicantMatchingDatum>[] | null
    >(null);
    const [processingError, setProcessingError] = React.useState(null);
    const [inProgress, setInProgress] = React.useState(false);

    // Make sure we aren't showing any diff if there's no file loaded.
    React.useEffect(() => {
        if (!fileContent) {
            if (diffed) {
                setDiffed(null);
            }
        }
    }, [diffed, setDiffed, fileContent]);

    // Recompute the diff every time the file changes
    React.useEffect(() => {
        // If we have no file or we are currently in the middle of processing another file,
        // do nothing.
        if (!fileContent || inProgress || !session) {
            return;
        }

        try {
            setProcessingError(null);
            // normalize the data coming from the file
            const data = normalizeImport(
                fileContent,
                applicantMatchingDatumSchema
            ) as MinimalApplicantMatchingDatum[];

            // Compute which applicantMatchingDatum have been added/modified
            const newDiff = diffImport.applicantMatchingData(data, {
                applicantMatchingData,
                applicants,
                session,
            });
            setDiffed(newDiff);
        } catch (e: any) {
            console.warn(e);
            setProcessingError(e);
        }
    }, [fileContent, applicantMatchingData, inProgress, session, applicants]);

    async function onConfirm() {
        if (!diffed) {
            throw new Error("Unable to compute an appropriate diff");
        }
        const changedApplicantMatchingData = getChanged(diffed);
        await dispatch(
            upsertApplicantMatchingData(changedApplicantMatchingData)
        );
        setFileContent(null);
    }

    let dialogContent = <p>No data loaded...</p>;
    if (processingError) {
        dialogContent = <Alert variant="danger">{"" + processingError}</Alert>;
    } else if (diffed) {
        const newItems = diffed
            .filter((item) => item.status === "new")
            .map((item) => item.obj);
        const modifiedDiffSpec = diffed.filter(
            (item) => item.status === "modified"
        );

        if (newItems.length === 0 && modifiedDiffSpec.length === 0) {
            dialogContent = (
                <Alert variant="warning">
                    No difference between imported applicants and those already
                    on the system.
                </Alert>
            );
        } else {
            dialogContent = (
                <>
                    {newItems.length > 0 && (
                        <Alert variant="primary">
                            <span className="mb-1">
                                The following <strong>{newItems.length}</strong>{" "}
                                appointment{newItems.length > 1 ? "s" : ""} will
                                be <strong>added</strong>
                            </span>
                            <AppointmentsList
                                applicantMatchingData={newItems}
                            />
                        </Alert>
                    )}
                    {modifiedDiffSpec.length > 0 && (
                        <Alert variant="info">
                            <span className="mb-1">
                                The following appointments will be{" "}
                                <strong>modified</strong>
                            </span>
                            <AppointmentsDiffList
                                modifiedApplicantMatchingData={modifiedDiffSpec}
                            />
                        </Alert>
                    )}
                </>
            );
        }
    }

    return (
        <ImportActionButton
            onConfirm={onConfirm}
            onFileChange={setFileContent}
            dialogContent={dialogContent}
            setInProgress={setInProgress}
        />
    );
}

export function ConnectedExportAppointmentsAction() {
    const dispatch = useThunkDispatch();
    const [exportType, setExportType] = React.useState<ExportFormat | null>(
        null
    );

    React.useEffect(() => {
        if (!exportType) {
            return;
        }

        async function doExport() {
            setExportType(null);
            if (exportType == null) {
                throw new Error(`Unknown export type ${exportType}`);
            }

            const file = await dispatch(
                exportApplicantMatchingData(
                    prepareApplicantMatchingData,
                    exportType
                )
            );

            FileSaver.saveAs(file as any);
        }
        doExport().catch(console.error);
    }, [exportType, dispatch]);

    function onClick(option: ExportFormat) {
        setExportType(option);
    }
    return <ExportActionButton onClick={onClick} />;
}

/**
 * Display a DiffSpec array of positions and highlight the changes.
 *
 * @export
 * @param {*} { modifiedApplicants }
 * @returns
 */
export function AppointmentsDiffList({
    modifiedApplicantMatchingData,
}: {
    modifiedApplicantMatchingData: DiffSpec<
        MinimalApplicantMatchingDatum,
        ApplicantMatchingDatum
    >[];
}) {
    return (
        <AppointmentsList
            applicantMatchingData={modifiedApplicantMatchingData as any[]}
            columns={createDiffColumnsFromColumns(DEFAULT_COLUMNS)}
        />
    );
}

/**
 * List the applicants using a ReactTable. `columns` can be passed
 * in to customize columns/cell renderers.
 *
 * @export
 * @param {{applicants: object[], columns: object[]}} props
 * @returns
 */
export function AppointmentsList(props: {
    applicantMatchingData: (
        | Omit<ApplicantMatchingDatum, "id">
        | ApplicantMatchingDatum
    )[];
    columns?: any[];
}) {
    const { applicantMatchingData, columns = DEFAULT_COLUMNS } = props;
    return (
        <AdvancedFilterTable
            columns={columns}
            data={applicantMatchingData}
            filterable={true}
        />
    );
}
AppointmentsList.propTypes = {
    applicantMatchingData: PropTypes.array.isRequired,
    columns: PropTypes.arrayOf(
        PropTypes.shape({ Header: PropTypes.any.isRequired })
    ),
};

const DEFAULT_COLUMNS = [
    { Header: "Last Name", accessor: "applicant.last_name" },
    { Header: "First Name", accessor: "applicant.first_name" },
    { Header: "UTORid", accessor: "applicant.utorid" },
    { Header: "Student Number", accessor: "applicant.student_number" },
    { Header: "Min Hours Owed", accessor: "min_hours_owed" },
    { Header: "Max Hours Owed", accessor: "max_hours_owed" },
    { Header: "Previous Hours Fulfilled", accessor: "prev_hours_fulfilled" },
];
