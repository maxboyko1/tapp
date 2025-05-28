export interface HasId {
    id: number;
}

export type UserRole = "admin" | "instructor" | "ta";

export type Utorid = string;

export type CustomQuestions = { elements: { type: "comment"; name: string; }[] } | null;

export type RequireSome<T extends object, S extends keyof T> = Partial<T> &
    Pick<T, S>;
