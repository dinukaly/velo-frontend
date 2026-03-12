"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { MOCK_PROJECTS } from "@/lib/mockData";
import { MOCK_FILE_CONTENT, inferLanguage } from "@/lib/mockFileContent";
import { fetchProjectById } from "@/services/projectService";
import { loadFileContent, saveFileContent } from "@/services/fileService";
import { IdeTopBar } from "@/components/ide/IdeTopBar";
import { IdeSidebar } from "@/components/ide/IdeSidebar";
import { IdeEditorArea } from "@/components/ide/IdeEditorArea";
import { IdeTerminalArea } from "@/components/ide/IdeTerminalArea";
import { Button } from "@/components/ui/button";
import type { FileNode } from "@/types/fileTree";
import type { FileTab } from "@/types/fileTab";
import type { Project } from "@/types/project";

export default function ProjectPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.id as string;

    const [project, setProject] = useState<Project | null>(null);
    const [projectLoading, setProjectLoading] = useState(true);

    // ----layout state----------
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [terminalOpen, setTerminalOpen] = useState(true);

    // --- tab state ------------
    const [openTabs, setOpenTabs] = useState<FileTab[]>([]);
    const [activeTabId, setActiveTabId] = useState<string | null>(null);

    const [isSaving, setIsSaving] = useState(false);

    // load the project from backend
    useEffect(() => {
        async function load() {
            setProjectLoading(true);
            try {
                const data = await fetchProjectById(projectId);
                setProject(data);
            } catch {
                // Backend not available — fall back to mock
                const mock = MOCK_PROJECTS.find((p) => p.id === projectId) ?? null;
                setProject(mock);
            } finally {
                setProjectLoading(false);
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

        // Try to load real content from backend; fall back to mock content
        let content: string;
        try {
            content = await loadFileContent(projectId, node.id);
        } catch {
            content = MOCK_FILE_CONTENT[node.id] ?? `// ${node.name}\n`;
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
            // Mark tab as clean
            setOpenTabs((prev) =>
                prev.map((t) =>
                    t.id === activeTabId ? { ...t, isDirty: false } : t
                )
            );
        } catch {
            // Save failed — keep dirty state so the user can retry
            console.error("[IDE] Failed to save file:", activeTabId);
        } finally {
            setIsSaving(false);
        }
    }, [activeTabId, isSaving, openTabs, projectId]);

    //  Loading state 
    if (projectLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
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
