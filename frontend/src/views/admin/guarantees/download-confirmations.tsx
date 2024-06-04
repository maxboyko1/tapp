import React from "react";
import { FaDownload } from "react-icons/fa";
import { ApplicantMatchingDatum } from "../../../api/defs/types";
import { ActionButton } from "../../../components/action-buttons";
import JSZip from "jszip";
import FileSaver from "file-saver";
import { GuaranteeConfirmDialog } from "./guarantee-confirm-dialog";

/**
 * Get the public url to download an Appointment
 *
 */
function confirmationUrl(applicantMatchingDatum: ApplicantMatchingDatum) {
    const url = new URL(window.location.origin);
    url.pathname = `/public/letters/${applicantMatchingDatum.active_confirmation_url_token}.pdf`;
    return url.href;
}

/**
 * Convert an Appointment into a filename
 *
 */
function applicantMatchingDatumToFilename(applicantMatchingDatum: ApplicantMatchingDatum) {
    const fileName = `${applicantMatchingDatum.applicant.last_name}, ${applicantMatchingDatum.applicant.first_name}.pdf`;
    // Escape characters that are not allowed in a file name
    // Code from https://stackoverflow.com/questions/42210199/remove-illegal-characters-from-a-file-name-but-leave-spaces
    return fileName.replace(/[/\\?%*:|"<>]/g, "-");
}

export function DownloadConfirmationPdfs({
    selectedApplicantMatchingData,
}: {
    selectedApplicantMatchingData: ApplicantMatchingDatum[];
}) {
    const [showConfirm, setShowConfirm] = React.useState(false);

    let disabledString = "";
    if (selectedApplicantMatchingData.length === 0) {
        disabledString = " (Cannot download appointment confirmation letters until some are selected)";
    } else if (
        selectedApplicantMatchingData.some(
            (applicantMatchingDatum) => !applicantMatchingDatum.active_confirmation_status
        )
    ) {
        disabledString = " (Some selected appointments do not have letters)";
    }

    async function downloadConfirmations() {
        const fetches = await Promise.all(
            selectedApplicantMatchingData.map((applicantMatchingDatum) =>
                Promise.all([
                    fetch(confirmationUrl(applicantMatchingDatum)),
                    applicantMatchingDatumToFilename(applicantMatchingDatum),
                ])
            )
        );
        const blobs = await Promise.all(
            fetches.map(([request, filename]) =>
                Promise.all([request.blob(), filename])
            )
        );
        const zip = new JSZip();

        for (const [blob, filename] of blobs) {
            zip.file(filename, blob);
        }
        const allDdahsBlob = await zip.generateAsync({ type: "blob" });
        FileSaver.saveAs(allDdahsBlob, "All-Appointment-Letter-PDFs.zip");
    }

    return (
        <React.Fragment>
            <ActionButton
                icon={FaDownload}
                disabled={!!disabledString}
                onClick={() => setShowConfirm(true)}
                title={
                    "Download PDF copies of confirmation letters for selected appointments" + disabledString
                }
            >
                Download PDFs
            </ActionButton>
            <GuaranteeConfirmDialog
                data={selectedApplicantMatchingData}
                visible={showConfirm}
                setVisible={setShowConfirm}
                callback={downloadConfirmations}
                title="Download appointment confirmation letter PDFs"
                body={`Download PDFs of the confirmation letters for the following ${selectedApplicantMatchingData.length} appointments.`}
                confirm={"Download"}
            />
        </React.Fragment>
    );
}
