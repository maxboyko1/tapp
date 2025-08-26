import React from "react";
import { useSelector } from "react-redux";
import FileSaver from "file-saver";

import { assignmentsSelector, exportApplications } from "../../../api/actions";
import { ExportActionButton } from "../../../components/export-button";
import {
    ExportFormat,
    prepareApplicationData,
} from "../../../libs/import-export";
import { useThunkDispatch } from "../../../libs/thunk-dispatch";
import { Application } from "../../../api/defs/types";

/**
 * Allows for the download of a file blob containing the exported instructors.
 * Instructors are synchronized from the server before being downloaded.
 *
 * @export
 * @returns
 */
export function ConnectedExportApplicationsAction() {
    const dispatch = useThunkDispatch();
    const [exportType, setExportType] = React.useState<ExportFormat | null>(
        null
    );
    const allAssignments = useSelector(assignmentsSelector);

    React.useEffect(() => {
        if (!exportType) {
            return;
        }

        async function doExport() {
            // Having an export type of `null` means we're ready to export again,
            // We set the export type to null at the start so in case an error occurs,
            // we can still try again. This *will not* affect the current value of `exportType`
            setExportType(null);
            if (exportType == null) {
                throw new Error(`Unknown export type ${exportType}`);
            }

            const prepareDataFunc = (applications: Application[], dataFormat: ExportFormat) =>
                prepareApplicationData(applications, dataFormat, allAssignments);

            const file = await dispatch(
                exportApplications(prepareDataFunc, exportType)
            );

            FileSaver.saveAs(file as any);
        }
        doExport().catch(console.error);
    }, [exportType, allAssignments, dispatch]);

    function onClick(option: ExportFormat) {
        setExportType(option);
    }

    return <ExportActionButton onClick={onClick} />;
}
