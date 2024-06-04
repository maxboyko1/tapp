import React from "react";
import { Button, Modal, Spinner } from "react-bootstrap";
import { Typeahead } from "react-bootstrap-typeahead";
import { useSelector } from "react-redux";
import {
    letterTemplatesSelector,
    upsertApplicantMatchingDatum,
} from "../../../api/actions";
import { ApplicantMatchingDatum, LetterTemplate } from "../../../api/defs/types";
import { EditFieldIcon } from "../../../components/edit-field-widgets";
import { useThunkDispatch } from "../../../libs/thunk-dispatch";

/**
 * Turn a list of LetterTemplate objects into a hash string for comparison as to whether
 * an instructor list has changed.
 *
 * @param {*} letterTemplates
 * @returns
 */
function hashLetterTemplateList(letterTemplates: LetterTemplate[]) {
    return letterTemplates
        .map((i) => `${i.template_file}, ${i.template_name}`)
        .sort()
        .join(";");
}

/**
 * A dialog allowing one to edit a letter template. `onChange` is called
 * when "save" is clicked while editing this value.
 *
 * @param {*} props
 * @returns
 */
function EditLetterTemplateDialog({
    applicantMatchingDatum,
    show,
    onHide,
    onChange,
}: {
    applicantMatchingDatum: ApplicantMatchingDatum;
    show: boolean;
    onHide: Function;
    onChange: Function;
}) {
    const value = [applicantMatchingDatum.letter_template];
    const allLetterTemplates = useSelector(letterTemplatesSelector);
    const [fieldVal, setFieldVal] = React.useState(value);
    const [inProgress, setInProgress] = React.useState(false);

    function cancelClick() {
        setFieldVal(value);
        onHide();
    }

    function saveClick() {
        async function doSave() {
            if (
                hashLetterTemplateList(fieldVal) !==
                hashLetterTemplateList(value)
            ) {
                setInProgress(true);
                // Only call `onChange` if the value has changed
                await onChange(fieldVal, value);
            }
        }
        doSave().finally(() => {
            setInProgress(false);
        });
    }
    // When a confirm operation is in progress, a spinner is displayed; otherwise
    // it's hidden
    const spinner = inProgress ? (
        <Spinner animation="border" size="sm" className="mr-1" />
    ) : null;

    const changeIndicator =
        // eslint-disable-next-line
        hashLetterTemplateList(fieldVal) ==
        hashLetterTemplateList(value) ? null : (
            <span>
                Change from{" "}
                <span className="field-dialog-formatted-name">
                    {value
                        .map(
                            (letterTemplate) =>
                                `${letterTemplate.template_name}`
                        )
                        .join(", ")}
                </span>{" "}
                to{" "}
                <span className="field-dialog-formatted-name">
                    {fieldVal
                        .map(
                            (letterTemplate) =>
                                `${letterTemplate.template_name}`
                        )
                        .join(", ")}
                </span>
            </span>
        );

    return (
        <Modal show={show} onHide={cancelClick}>
            <Modal.Header closeButton>
                <Modal.Title>
                    Edit Letter Template
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Typeahead
                    id="instructors-input"
                    ignoreDiacritics={true}
                    multiple
                    placeholder="Letter Template..."
                    labelKey={(option) => `${option.template_name}`}
                    selected={fieldVal}
                    options={allLetterTemplates}
                    onChange={(val) =>
                        setFieldVal([
                            val[val.length - 1] || applicantMatchingDatum.letter_template,
                        ])
                    }
                />{" "}
                {changeIndicator}
            </Modal.Body>
            <Modal.Footer>
                <Button onClick={cancelClick} variant="outline-secondary">
                    Cancel
                </Button>
                <Button onClick={saveClick}>{spinner}Save</Button>
            </Modal.Footer>
        </Modal>
    );
}

export function EditLetterTemplateCell({
    row,
}: {
    row: { original: ApplicantMatchingDatum };
}) {
    const applicantMatchingDatum = row.original;
    const [dialogShow, setDialogShow] = React.useState(false);
    const dispatch = useThunkDispatch();

    if (!applicantMatchingDatum.letter_template) {
        return null;
    }

    return (
        <div className="show-on-hover-wrapper">
            {applicantMatchingDatum.letter_template?.template_name}
            <EditFieldIcon
                title="Edit the letter template for this appointment"
                hidden={false}
                onClick={() => setDialogShow(true)}
            />
            <EditLetterTemplateDialog
                applicantMatchingDatum={applicantMatchingDatum}
                show={dialogShow}
                onHide={() => setDialogShow(false)}
                onChange={async (newLetterTemplate: LetterTemplate[]) => {
                    // An appointment must have a LetterTemplate. Bail if we're trying to "unset" one.
                    if (newLetterTemplate.length === 0) {
                        return;
                    }
                    await dispatch(
                        upsertApplicantMatchingDatum({
                            id: applicantMatchingDatum.id,
                            letter_template:
                                newLetterTemplate[
                                    newLetterTemplate.length - 1
                                ] || applicantMatchingDatum.letter_template,
                        })
                    );
                    setDialogShow(false);
                }}
            />
        </div>
    );
}
