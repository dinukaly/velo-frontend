"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { MOCK_PROJECTS } from "@/lib/mockData";
import { MOCK_FILE_CONTENT, inferLanguage } from "@/lib/mockFileContent";
import { IdeTopBar } from "@/components/ide/IdeTopBar";
import { IdeSidebar } from "@/components/ide/IdeSidebar";
import { IdeEditorArea } from "@/components/ide/IdeEditorArea";
import { IdeTerminalArea } from "@/components/ide/IdeTerminalArea";
import { Button } from "@/components/ui/button";
import type { FileNode } from "@/types/fileTree";
import type { FileTab } from "@/types/fileTab";

export default function ProjectPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.id as string;

    // Resolve project from mock data
    const project = MOCK_PROJECTS.find((p) => p.id === projectId) ?? null;

    // ----layout state----------
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [terminalOpen, setTerminalOpen] = useState(true);

    // --- tab state ------------
    const [openTabs, setOpenTabs] = useState<FileTab[]>([]);
    const [activeTabId, setActiveTabId] = useState<string | null>(null);

    // -------- Tab handlers -------------------

    function handleFileOpen(node: FileNode) {
        setOpenTabs((prev) => {
            // Don't duplicate an already-open tab
            if (prev.find((t) => t.id === node.id)) return prev;
            const newTab: FileTab = {
                id: node.id,
                name: node.name,
                language: inferLanguage(node.name),
                content: MOCK_FILE_CONTENT[node.id] ?? `// ${node.name}\n`,
                isDirty: false,
            };
            return [...prev, newTab];
        });
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
    //----- 404 fallback ---------
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
            />

            {/* ---- Workspace ------------------- */}
            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <IdeSidebar 
                project={project}
                open={sidebarOpen}
                onFileOpen={handleFileOpen}
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
                    {terminalOpen && <IdeTerminalArea />}
                </div>
            </div>
        </div>
    );
}
