"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { MOCK_PROJECTS } from "@/lib/mockData";
import { IdeTopBar } from "@/components/ide/IdeTopBar";
import { IdeSidebar } from "@/components/ide/IdeSidebar";
import { IdeEditorArea } from "@/components/ide/IdeEditorArea";
import { IdeTerminalArea } from "@/components/ide/IdeTerminalArea";
import { Button } from "@/components/ui/button";

export default function ProjectPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.id as string;

    // Resolve project from mock data
    const project = MOCK_PROJECTS.find((p) => p.id === projectId) ?? null;

    // Sidebar and terminal panel state
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [terminalOpen, setTerminalOpen] = useState(true);

    // 404-like fallback for unknown project IDs
    if (!project) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background">
                <p className="text-muted-foreground">Project not found.</p>
                <Button variant="outline" size="sm" onClick={() => router.push("/dashboard")}>
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
                <IdeSidebar project={project} open={sidebarOpen} />

                {/* Editor + Terminal column */}
                <div className="flex flex-1 flex-col overflow-hidden">
                    <IdeEditorArea />
                    {terminalOpen && <IdeTerminalArea />}
                </div>
            </div>
        </div>
    );
}
