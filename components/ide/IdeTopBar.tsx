"use client";

import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    Play,
    PanelLeft,
    Terminal,
    Save,
    Settings,
    Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { LANGUAGE_COLOURS } from "@/lib/constants";
import type { Project } from "@/types/project";
import { useTerminalStore, type TerminalConnectionStatus } from "@/store/terminalStore";
import { cn } from "@/lib/utils";

const STATUS_DOT_CLASSES: Record<TerminalConnectionStatus, string> = {
    idle: "bg-muted-foreground/30",
    connecting: "bg-yellow-400 animate-pulse",
    connected: "bg-green-400",
    reconnecting: "bg-yellow-400 animate-pulse",
    disconnected: "bg-red-500",
};

const STATUS_TITLES: Record<TerminalConnectionStatus, string> = {
    idle: "Terminal",
    connecting: "Terminal — connecting…",
    connected: "Terminal — connected to backend",
    reconnecting: "Terminal — reconnecting…",
    disconnected: "Terminal — disconnected",
};

interface IdeTopBarProps {
    project: Project;
    sidebarOpen: boolean;
    onToggleSidebar: () => void;
    terminalOpen: boolean;
    onToggleTerminal: () => void;
    /** Called when the user clicks Save */
    onSave: () => void;
    /** True while the save request is in-flight */
    isSaving: boolean;
    /** True if any open tab has unsaved changes */
    hasUnsavedChanges: boolean;
}

export function IdeTopBar({
    project,
    sidebarOpen,
    onToggleSidebar,
    terminalOpen,
    onToggleTerminal,
    onSave,
    isSaving,
    hasUnsavedChanges,
}: IdeTopBarProps) {
    const router = useRouter();
    const langColour = LANGUAGE_COLOURS[project.language];
    const terminalStatus = useTerminalStore((s) => s.status);

    return (
        <header className="flex h-11 shrink-0 items-center gap-1 border-b border-border bg-card/80 px-2 backdrop-blur-sm">
            {/* Back to dashboard */}
            <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => router.push("/dashboard")}
                title="Back to dashboard"
            >
                <ArrowLeft className="h-4 w-4" />
            </Button>

            <Separator orientation="vertical" className="mx-1 h-5" />

            {/* Sidebar toggle */}
            <Button
                variant={sidebarOpen ? "secondary" : "ghost"}
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={onToggleSidebar}
                title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
            >
                <PanelLeft className="h-4 w-4" />
            </Button>

            <Separator orientation="vertical" className="mx-1 h-5" />

            {/* Project name + language */}
            <div className="flex items-center gap-2 min-w-0 flex-1 px-1">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-primary shrink-0"
                >
                    <polyline points="16 18 22 12 16 6" />
                    <polyline points="8 6 2 12 8 18" />
                </svg>
                <span className="truncate text-sm font-semibold">{project.name}</span>
                <Badge
                    variant="outline"
                    className={`hidden sm:inline-flex shrink-0 text-xs font-medium ${langColour}`}
                >
                    {project.language}
                </Badge>
            </div>

            {/* Right-side actions */}
            <div className="flex items-center gap-1 ml-auto">
                {/* Save */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground relative"
                    title={isSaving ? "Saving…" : hasUnsavedChanges ? "Save (unsaved changes)" : "Save"}
                    onClick={onSave}
                    disabled={isSaving || !hasUnsavedChanges}
                >
                    {isSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <>
                            <Save className="h-4 w-4" />
                            {hasUnsavedChanges && (
                                <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-primary" />
                            )}
                        </>
                    )}
                </Button>

                {/* Terminal toggle */}
                <Button
                    variant={terminalOpen ? "secondary" : "ghost"}
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground relative"
                    onClick={onToggleTerminal}
                    title={STATUS_TITLES[terminalStatus]}
                >
                    <Terminal className="h-4 w-4" />
                    <span
                        className={cn(
                            "absolute bottom-0.5 right-0.5 h-1.5 w-1.5 rounded-full",
                            STATUS_DOT_CLASSES[terminalStatus]
                        )}
                    />
                </Button>

                <Separator orientation="vertical" className="mx-1 h-5" />

                {/* Settings (placeholder) */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    title="Settings (coming soon)"
                    disabled
                >
                    <Settings className="h-4 w-4" />
                </Button>

                {/* Run (placeholder) */}
                <Button
                    size="sm"
                    className="h-7 gap-1.5 px-3 text-xs bg-green-600 hover:bg-green-700 text-white border-0"
                    title="Run (coming soon)"
                    disabled
                >
                    <Play className="h-3.5 w-3.5 fill-current" />
                    Run
                </Button>
            </div>
        </header>
    );
}
