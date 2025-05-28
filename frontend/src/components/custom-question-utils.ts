import { CustomQuestions } from "../api/defs/types";

export const emptyCustomQuestions: CustomQuestions = { elements: [] }

export function areAllQuestionsNonEmpty(customQuestions: CustomQuestions | undefined): boolean {
    if (!customQuestions) {
        return true;
    }
    return customQuestions.elements.every((question: {name: string}) => (
        question.name && question.name.trim() !== ""
    ));
}

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

export function isQuestionsJsonImportInValidFormat(questionsAsString: string): boolean {
    try {
        if (questionsAsString === "") {
            return true;
        }
        const questions = JSON.parse(questionsAsString);
        if (!Array.isArray(questions)) {
            return false;
        }
        return questions.every((question: string) => (
            typeof question === "string" && question.trim() !== ""
        ));
    } catch (e) {
        return false;
    }
}

export function formatCustomQuestionsForExport(customQuestions: CustomQuestions | undefined): string {
    if (!isQuestionsFieldInValidFormat(customQuestions)) {
        throw new Error("Custom questions not in expected format");
    }
    return JSON.stringify(customQuestions?.elements.map((question: { name: string }) => question.name));
}