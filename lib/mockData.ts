import type { Project, ProjectLanguage } from "@/types/project";

/** Static mock projects used until the real API is connected. */
export const MOCK_PROJECTS: Project[] = [
    {
        id: "proj-1",
        name: "api-gateway",
        description: "REST API gateway with authentication and rate limiting.",
        language: "TypeScript",
        createdAt: "2025-12-01T09:00:00Z",
        updatedAt: "2026-02-20T14:32:00Z",
    },
    {
        id: "proj-2",
        name: "data-pipeline",
        description: "ETL pipeline for processing and transforming raw event streams.",
        language: "Python",
        createdAt: "2026-01-10T11:15:00Z",
        updatedAt: "2026-02-22T08:10:00Z",
    },
    {
        id: "proj-3",
        name: "microservice-auth",
        description: "JWT-based authentication microservice with refresh token rotation.",
        language: "Go",
        createdAt: "2026-01-18T07:45:00Z",
        updatedAt: "2026-02-24T17:55:00Z",
    },
    {
        id: "proj-4",
        name: "realtime-dashboard",
        description: "WebSocket-powered analytics dashboard with live chart updates.",
        language: "TypeScript",
        createdAt: "2026-02-01T13:30:00Z",
        updatedAt: "2026-02-23T10:40:00Z",
    },
    {
        id: "proj-5",
        name: "ml-inference-server",
        description: "FastAPI server exposing trained ML models as HTTP endpoints.",
        language: "Python",
        createdAt: "2026-02-14T16:20:00Z",
        updatedAt: "2026-02-24T22:15:00Z",
    },
];

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
