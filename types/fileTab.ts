export interface FileTab {
    /** Same id as the FileNode it originated from. */
    id: string;
    /** Display name (filename). */
    name: string;
    /** Monaco language identifier (e.g. "typescript", "json"). */
    language: string;
    /** Current in-memory file content. */
    content: string;
    /** True when content has been modified since the tab was opened. */
    isDirty: boolean;
}
