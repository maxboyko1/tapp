import { CustomQuestions } from "../api/defs/types";

export const emptyCustomQuestions: CustomQuestions = { elements: [] };

/**
 * Return true if all custom questions are non-empty and unique.
 * @param customQuestions in JSON blob format
 * @returns
 */
export function areAllQuestionsValid(customQuestions: CustomQuestions | undefined): boolean {
    if (!customQuestions) {
        return true;
    }
    const names = customQuestions.elements.map(
        (question: { name: string }) => question.name && question.name.trim()
    );
    const uniqueNames = new Set(names.filter(Boolean));
    return (
        names.every((name) => !!name) &&
        uniqueNames.size === names.length
    );
}

/**
 * Verify that the custom questions JSON provided is in the expected format.
 * @param customQuestions in JSON blob format
 * @returns
 */
export function isQuestionsFieldInValidFormat(customQuestions: CustomQuestions | undefined): boolean {
    if (!customQuestions) {
        return true;
    }
    const keys = Object.keys(customQuestions);
    if (keys.length !== 1 || keys[0] !== "elements") {
        return false;
    }
    return customQuestions.elements.every((question: {name: string, type: string}) => 
        question.type === "comment"
    );
}

/**
 * Check the validity of the custom questions as they are provided in the JSON import.
 * @param questionsAsString questions in ["An", "Array", "Like", "This"] format, stringified
 * @returns
 */
export function isQuestionsJsonImportInValidFormat(questionsAsString: string): boolean {
    try {
        if (questionsAsString === "") {
            return true;
        }
        const questions = JSON.parse(questionsAsString);
        if (!Array.isArray(questions)) {
            return false;
        }
        if (!questions.every((question: string) => typeof question === "string" && question.trim() !== "")) {
            return false;
        }
        const trimmedNames = questions.map((q: string) => q.trim());
        const uniqueNames = new Set(trimmedNames);
        return uniqueNames.size === trimmedNames.length;
    } catch {
        return false;
    }
}

/**
 * Output custom question names in stringified array format for the JSON export.
 * @param customQuestions in JSON blob format
 * @returns
 */
export function getCustomQuestionNamesAsArrayStr(customQuestions: CustomQuestions | undefined): string {
    if (!isQuestionsFieldInValidFormat(customQuestions)) {
        throw new Error("Custom questions not in expected format");
    }
    return JSON.stringify(customQuestions?.elements.map((question: { name: string }) => question.name));
}