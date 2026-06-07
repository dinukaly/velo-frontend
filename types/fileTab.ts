import type { GitDiff } from "@/types/git";

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
    /** Normal editor tab by default; diff tabs render a read-only IDE diff view. */
    tabType?: "file" | "diff";
    /** Diff payload for source-control diff tabs. */
    diff?: GitDiff;
}
