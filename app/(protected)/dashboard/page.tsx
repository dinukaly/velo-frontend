"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Search, LayoutGrid, List, FolderOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { fetchProjects, createProject, deleteProject } from "@/services/projectService";
import type { CreateProjectPayload } from "@/services/projectService";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { CreateProjectModal } from "@/components/dashboard/CreateProjectModal";
import { DeleteProjectModal } from "@/components/dashboard/DeleteProjectModal";
import type { Project } from "@/types/project";
import { toast } from "sonner";

export default function DashboardPage() {
    const router = useRouter();
    const logout = useAuthStore((state) => state.logout);

    // ---- State -----------------------
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [view, setView] = useState<"grid" | "list">("grid");
    const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
    const [deleteOpen, setDeleteOpen] = useState(false);

    // ─── Load projects from backend ────────────────────
    const loadProjects = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await fetchProjects();
            setProjects(data);
        } catch {
            console.error("[Dashboard] Failed to load projects.");
            toast.error("Failed to load projects.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadProjects();
    }, [loadProjects]);

    // ---- Derived -----------------------
    const filtered = projects.filter(
        (p) =>
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.description.toLowerCase().includes(search.toLowerCase()) ||
            p.language.toLowerCase().includes(search.toLowerCase())
    );

    // ---- Handlers -----------------------
    function handleLogout() {
        logout();
        router.replace("/login");
    }

    async function handleCreateProject(data: CreateProjectPayload) {
        try {
            const created = await createProject(data);
            setProjects((prev) => [created, ...prev]);
            toast.success("Project created successfully");
        } catch {
            toast.error("Failed to create project");
        }
    }

    function handleDeleteClick(project: Project) {
        setDeleteTarget(project);
        setDeleteOpen(true);
    }

    async function handleDeleteConfirm(id: string) {
        // Optimistic UI — remove immediately, rollback on error
        setProjects((prev) => prev.filter((p) => p.id !== id));
        try {
            await deleteProject(id);
            toast.success("Project deleted successfully");
        } catch {
            // If the backend call fails, reload so the UI reflects true server state
            await loadProjects();
            toast.error("Failed to delete project");
        }
    }

    return (
        <div className="flex flex-col min-h-screen">
            {/*------Top nav-------------------*/}
            <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card/70 px-6 py-3 backdrop-blur-md">
                <div className="flex items-center gap-2.5 font-semibold tracking-tight text-sm">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-primary"
                    >
                        <polyline points="16 18 22 12 16 6" />
                        <polyline points="8 6 2 12 8 18" />
                    </svg>
                    Velo
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="text-muted-foreground hover:text-foreground"
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                </Button>
            </header>

            {/*------Main content-------------------*/}
            <main className="flex-1 w-full px-6 py-8 space-y-6">

                {/* Page heading */}
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
                    <p className="text-sm text-muted-foreground">
                        {isLoading
                            ? "Loading your workspace…"
                            : `${projects.length} project${projects.length !== 1 ? "s" : ""} in your workspace`}
                    </p>
                </div>

                {/* Toolbar */}
                <div className="flex items-center gap-3 flex-wrap">
                    {/* Search */}
                    <div className="relative flex-1 min-w-48">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search projects…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-md border border-border bg-background/50 py-2 pl-9 pr-3 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 transition-shadow"
                        />
                    </div>

                    {/* View toggle */}
                    <div className="flex items-center rounded-md border border-border bg-muted/40 p-1 gap-0.5">
                        <Button
                            variant={view === "grid" ? "secondary" : "ghost"}
                            size="sm"
                            className="h-7 w-8 p-0"
                            onClick={() => setView("grid")}
                            title="Grid view"
                        >
                            <LayoutGrid className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                            variant={view === "list" ? "secondary" : "ghost"}
                            size="sm"
                            className="h-7 w-8 p-0"
                            onClick={() => setView("list")}
                            title="List view"
                        >
                            <List className="h-3.5 w-3.5" />
                        </Button>
                    </div>

                    {/* Create project */}
                    <CreateProjectModal onConfirm={handleCreateProject} />
                </div>

                {/* Loading state */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : filtered.length === 0 ? (
                    <EmptyState
                        hasSearch={search.length > 0}
                        onClearSearch={() => setSearch("")}
                    />
                ) : (
                    <div
                        className={
                            view === "grid"
                                ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
                                : "flex flex-col gap-3"
                        }
                    >
                        {filtered.map((project) => (
                            <ProjectCard
                                key={project.id}
                                project={project}
                                onDelete={handleDeleteClick}
                            />
                        ))}
                    </div>
                )}
            </main>

            {/* Delete confirmation modal */}
            <DeleteProjectModal
                project={deleteTarget}
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                onConfirm={handleDeleteConfirm}
            />
        </div>
    );
}

//Empty state sub-component 
function EmptyState({
    hasSearch,
    onClearSearch,
}: {
    hasSearch: boolean;
    onClearSearch: () => void;
}) {
    return (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-muted/20 py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card text-muted-foreground">
                <FolderOpen className="h-7 w-7" />
            </div>
            <div className="space-y-1">
                <p className="font-semibold text-foreground">
                    {hasSearch ? "No projects matched your search" : "No projects yet"}
                </p>
                <p className="text-sm text-muted-foreground">
                    {hasSearch
                        ? "Try adjusting your search terms."
                        : "Create your first project to get started."}
                </p>
            </div>
            {hasSearch && (
                <Button variant="outline" size="sm" onClick={onClearSearch}>
                    Clear search
                </Button>
            )}
        </div>
    );
}
