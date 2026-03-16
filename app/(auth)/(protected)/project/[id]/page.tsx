"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { MOCK_PROJECTS } from "@/lib/mockData";
import { fetchProjectById } from "@/services/projectService";
import { openEnvironment } from "@/services/environmentService";
import { loadFileContent, saveFileContent } from "@/services/fileService";
import { IdeTopBar } from "@/components/ide/IdeTopBar";
import { IdeSidebar } from "@/components/ide/IdeSidebar";
import { IdeEditorArea } from "@/components/ide/IdeEditorArea";
import { IdeTerminalArea } from "@/components/ide/IdeTerminalArea";
import { Button } from "@/components/ui/button";
import type { FileNode } from "@/types/fileTree";
import type { FileTab } from "@/types/fileTab";
import type { Project } from "@/types/project";

function inferLanguage(filename: string): string {
    const ext = filename.split(".").pop()?.toLowerCase();
    switch (ext) {
        case "ts": case "tsx": return "typescript";
        case "js": case "jsx": return "javascript";
        case "py": return "python";
        case "java": return "java";
        case "json": return "json";
        case "md": return "markdown";
        case "html": return "html";
        case "css": return "css";
        default: return "plaintext";
    }
}

export default function ProjectPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.id as string;

    const [project, setProject] = useState<Project | null>(null);
    // ---- loading state ----------
    const [projectLoading, setProjectLoading] = useState(true);
    const [loadingStep, setLoadingStep] = useState<string>("Initializing workspace...");

    // ----layout state----------
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [terminalOpen, setTerminalOpen] = useState(true);

    // --- tab state ------------
    const [openTabs, setOpenTabs] = useState<FileTab[]>([]);
    const [activeTabId, setActiveTabId] = useState<string | null>(null);

    const [isSaving, setIsSaving] = useState(false);

    // Guard to ensure we only call openEnvironment once per session (prevents React 18 double-firing)
    const hasOpenedEnv = useRef(false);

    // load the project from backend
    useEffect(() => {
        async function load() {
            setProjectLoading(true);
            try {
                // 1. Fetch metadata
                setLoadingStep("Fetching project metadata...");
                const data = await fetchProjectById(projectId);
                setProject(data);

                // 2. Initialize environment (once only)
                if (!hasOpenedEnv.current) {
                    hasOpenedEnv.current = true;
                    setLoadingStep("Preparing your secure container...");
                    // This might take several seconds as the backend pulls images/starts containers
                    await openEnvironment(projectId);
                }

                setLoadingStep("Workspace ready!");
            } catch (err) {
                console.error("[IDE] Failed to load project metadata:", err);
                // Backend not available — fall back to mock
                const mock = MOCK_PROJECTS.find((p) => p.id === projectId) ?? null;
                setProject(mock);

                if (!mock) {
                    setLoadingStep("Failed to load project.");
                }
            } finally {
                // Brief delay so the user can see the "Ready" message
                setTimeout(() => {
                    setProjectLoading(false);
                }, 500);
            }
        }
        load();
    }, [projectId]);

    // -------- Tab handlers -------------------

    async function handleFileOpen(node: FileNode) {
        // Don't duplicate an already-open tab
        const existing = openTabs.find((t) => t.id === node.id);
        if (existing) {
            setActiveTabId(node.id);
            return;
        }

        // Try to load real content from backend
        let content: string;
        try {
            content = await loadFileContent(projectId, node.id);
        } catch (err) {
            console.error("[IDE] Could not load file content", err);
            content = `// Error: Failed to load content for ${node.name}\n`;
        }

        const newTab: FileTab = {
            id: node.id,
            name: node.name,
            language: inferLanguage(node.name),
            content,
            isDirty: false,
        };
        setOpenTabs((prev) => [...prev, newTab]);
        setActiveTabId(node.id);
    }

    function handleTabClose(id: string) {
        setOpenTabs((prev) => {
            const remaining = prev.filter((t) => t.id !== id);
            // If we closed the active tab, activate the nearest remaining one
            if (activeTabId === id) {
                const closedIndex = prev.findIndex((t) => t.id === id);
                const next =
                    remaining[closedIndex] ??        // prefer tab to the right
                    remaining[closedIndex - 1] ??    // or left
                    null;
                setActiveTabId(next?.id ?? null);
            }
            return remaining;
        });
    }

    function handleContentChange(id: string, content: string) {
        setOpenTabs((prev) =>
            prev.map((t) => (t.id === id ? { ...t, content, isDirty: true } : t))
        );
    }

    //  Save handler
    const handleSave = useCallback(async () => {
        if (!activeTabId || isSaving) return;

        const activeTab = openTabs.find((t) => t.id === activeTabId);
        if (!activeTab || !activeTab.isDirty) return;

        setIsSaving(true);
        try {
            await saveFileContent(projectId, activeTabId, {
                content: activeTab.content,
            });
            // Mark tab as clean on success
            setOpenTabs((prev) =>
                prev.map((t) =>
                    t.id === activeTabId ? { ...t, isDirty: false } : t
                )
            );
        } catch (err) {
            // Save failed — keep dirty state so the user can retry
            console.error("[IDE] Failed to save file:", activeTabId, err);
        } finally {
            setIsSaving(false);
        }
    }, [activeTabId, isSaving, openTabs, projectId]);

    //  Loading state 
    if (projectLoading) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-background gap-6">
                <div className="relative">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-primary" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    </div>
                </div>

                <div className="flex flex-col items-center gap-2 max-w-xs text-center">
                    <h3 className="text-lg font-semibold tracking-tight">Setting up Velo</h3>
                    <p className="text-sm text-muted-foreground animate-in fade-in slide-in-from-bottom-1 duration-500">
                        {loadingStep}
                    </p>
                    <div className="w-48 h-1.5 bg-muted rounded-full overflow-hidden mt-4">
                        <div className="h-full bg-primary/40 animate-progress-indeterminate" />
                    </div>
                </div>
            </div>
        );
    }

    // 404-like fallback
    if (!project) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background">
                <p className="text-muted-foreground">Project not found.</p>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/dashboard")}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                </Button>
            </div>
        );
    }

    return (
        <div className="flex h-screen flex-col overflow-hidden bg-background">
            {/* ---- Top bar ----------------------- */}
            <IdeTopBar
                project={project}
                sidebarOpen={sidebarOpen}
                onToggleSidebar={() => setSidebarOpen((v) => !v)}
                terminalOpen={terminalOpen}
                onToggleTerminal={() => setTerminalOpen((v) => !v)}
                onSave={handleSave}
                isSaving={isSaving}
                hasUnsavedChanges={openTabs.some((t) => t.isDirty)}
            />

            {/* ---- Workspace ------------------- */}
            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <IdeSidebar
                    project={project}
                    open={sidebarOpen}
                    onFileOpen={handleFileOpen}
                    projectId={projectId}
                />

                {/* Editor + Terminal column */}
                <div className="flex flex-1 flex-col overflow-hidden">
                    <IdeEditorArea
                        openTabs={openTabs}
                        activeTabId={activeTabId}
                        onTabSelect={setActiveTabId}
                        onTabClose={handleTabClose}
                        onContentChange={handleContentChange}
                    />
                    {terminalOpen && (
                        <IdeTerminalArea projectId={projectId} />
                    )}
                </div>
            </div>
        </div>
    );
}
