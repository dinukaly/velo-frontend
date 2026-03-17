import type { Project, ProjectLanguage } from "@/types/project";

/** Maps a language label to a Tailwind colour class pair [bg, text]. */
export const LANGUAGE_COLOURS: Record<ProjectLanguage, string> = {
    TypeScript: "bg-blue-500/15 text-blue-400 border-blue-500/20",
    JavaScript: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
    Python: "bg-green-500/15 text-green-400 border-green-500/20",
    Go: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
    Rust: "bg-orange-500/15 text-orange-400 border-orange-500/20",
    Java: "bg-red-500/15 text-red-400 border-red-500/20",
    "C++": "bg-purple-500/15 text-purple-400 border-purple-500/20",
    Other: "bg-muted text-muted-foreground border-border",
};
