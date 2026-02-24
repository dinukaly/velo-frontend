export type ProjectLanguage =
    | "TypeScript"
    | "JavaScript"
    | "Python"
    | "Go"
    | "Rust"
    | "Java"
    | "C++"
    | "Other";

export interface Project {
    id: string;
    name: string;
    description: string;
    language: ProjectLanguage;
    /** ISO date string */
    updatedAt: string;
    /** ISO date string */
    createdAt: string;
}
