"use client";

import {
    useState,
    useEffect,
    useCallback,
    useRef,
    type Dispatch,
    type PointerEvent as ReactPointerEvent,
    type SetStateAction,
} from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { fetchProjectById } from "@/services/projectService";
import { openEnvironment } from "@/services/environmentService";
import { loadFileContent, saveFileContent } from "@/services/fileService";
import { IdeTopBar } from "@/components/ide/IdeTopBar";
import { IdeSidebar } from "@/components/ide/IdeSidebar";
import { IdeEditorArea } from "@/components/ide/IdeEditorArea";
import { IdeTerminalArea } from "@/components/ide/IdeTerminalArea";
import { IdeGitPanel } from "@/components/ide/IdeGitPanel";
import { Button } from "@/components/ui/button";
import type { FileNode } from "@/types/fileTree";
import type { FileTab } from "@/types/fileTab";
import type { GitDiff } from "@/types/git";
import type { Project } from "@/types/project";
import { toast } from "sonner";
import { IdeAiChat } from "@/components/ide/IdeChat";
import { useTerminalStore } from "@/store/terminalStore";

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
}

function startPanelResize(
    event: ReactPointerEvent<HTMLDivElement>,
    {
        axis,
        direction = 1,
        max,
        min,
        setSize,
        size,
    }: {
        axis: "x" | "y";
        direction?: 1 | -1;
        max: number;
        min: number;
        setSize: Dispatch<SetStateAction<number>>;
        size: number;
    }
) {
    event.preventDefault();

    const startPoint = axis === "x" ? event.clientX : event.clientY;
    const cursor = axis === "x" ? "col-resize" : "row-resize";
    const previousCursor = document.body.style.cursor;
    const previousUserSelect = document.body.style.userSelect;

    document.body.style.cursor = cursor;
    document.body.style.userSelect = "none";

    function handlePointerMove(moveEvent: PointerEvent) {
        const currentPoint = axis === "x" ? moveEvent.clientX : moveEvent.clientY;
        const delta = (currentPoint - startPoint) * direction;
        setSize(clamp(size + delta, min, max));
    }

    function handlePointerUp() {
        document.body.style.cursor = previousCursor;
        document.body.style.userSelect = previousUserSelect;
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
}

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
    const [aiOpen, setAiOpen] = useState(false);
    const [gitOpen, setGitOpen] = useState(false);
    const [fileTreeVersion, setFileTreeVersion] = useState(0);
    const [sidebarWidth, setSidebarWidth] = useState(224);
    const [terminalHeight, setTerminalHeight] = useState(256);
    const [aiWidth, setAiWidth] = useState(320);
    const [gitWidth, setGitWidth] = useState(384);

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
                setLoadingStep("Failed to load project.");
                toast.error("Failed to load project.");
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
            toast.error(`Failed to load content for ${node.name}`);
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
            await saveFileContent(projectId, activeTabId, activeTab.content);
            // Mark tab as clean on success
            setOpenTabs((prev) =>
                prev.map((t) =>
                    t.id === activeTabId ? { ...t, isDirty: false } : t
                )
            );
            toast.success("File saved successfully");
        } catch (err) {
            // Save failed — keep dirty state so the user can retry
            console.error("[IDE] Failed to save file:", activeTabId, err);
            toast.error("Failed to save file.");
        } finally {
            setIsSaving(false);
        }
    }, [activeTabId, isSaving, openTabs, projectId]);

    const handleRepositoryChanged = useCallback(() => {
        setOpenTabs([]);
        setActiveTabId(null);
        setFileTreeVersion((version) => version + 1);
    }, []);

    const handleOpenGitDiff = useCallback((diff: GitDiff, staged: boolean) => {
        const path = diff.path ?? "working-tree";
        const id = `git-diff:${staged ? "staged" : "unstaged"}:${path}`;
        const name = `${path.split("/").pop() ?? "Diff"} ${staged ? "(staged)" : "(changes)"}`;

        const diffTab: FileTab = {
            id,
            name,
            language: "diff",
            content: diff.diff,
            isDirty: false,
            tabType: "diff",
            diff,
        };

        setOpenTabs((prev) => {
            const exists = prev.some((tab) => tab.id === id);
            return exists
                ? prev.map((tab) => (tab.id === id ? diffTab : tab))
                : [...prev, diffTab];
        });
        setActiveTabId(id);
    }, []);

    // Run handler
    const handleRun = useCallback(() => {
        if (!project) return;
        
        if (!terminalOpen) {
            setTerminalOpen(true);
            toast.info("Terminal opening, please wait a moment and click Run again.");
            return;
        }

        const sendData = useTerminalStore.getState().sendData;
        if (!sendData) {
            toast.error("Terminal not connected.");
            return;
        }

        let cmd = "echo 'No default run command configured for this language'\n";
        switch (project.language) {
            case "TypeScript":
            case "JavaScript":
                cmd = "npm start\n";
                break;
            case "Python":
                cmd = "python main.py\n";
                break;
            case "Go":
                cmd = "go run .\n";
                break;
            case "Rust":
                cmd = "cargo run\n";
                break;
            case "Java":
                cmd = "mvn spring-boot:run\n";
                break;
            case "C++":
                cmd = "g++ main.cpp -o main && ./main\n";
                break;
        }

        // Clear terminal visually and run
        sendData("clear\n");
        setTimeout(() => sendData(cmd), 100);
    }, [project, terminalOpen]);

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
                //functional props
                onToggleSidebar={() => setSidebarOpen((v) => !v)}
                terminalOpen={terminalOpen}
                onToggleTerminal={() => setTerminalOpen((v) => !v)}
                aiOpen={aiOpen}
                onToggleAi={() => setAiOpen((v) => !v)}
                gitOpen={gitOpen}
                onToggleGit={() => setGitOpen((v) => !v)}
                onSave={handleSave}
                isSaving={isSaving}
                hasUnsavedChanges={openTabs.some((t) => t.isDirty)}
                onRun={handleRun}
            />

            {/* ---- Workspace ------------------- */}
            <div className="flex min-h-0 flex-1 overflow-hidden">
                {/* Sidebar */}
                {sidebarOpen && (
                    <>
                        <IdeSidebar
                            key={fileTreeVersion}
                            project={project}
                            open={sidebarOpen}
                            onFileOpen={handleFileOpen}
                            projectId={projectId}
                            width={sidebarWidth}
                        />
                        <div
                            className="group relative z-10 h-full w-1 shrink-0 cursor-col-resize bg-border/60 transition-colors hover:bg-primary/70"
                            role="separator"
                            aria-orientation="vertical"
                            title="Resize explorer"
                            onPointerDown={(event) =>
                                startPanelResize(event, {
                                    axis: "x",
                                    max: 520,
                                    min: 180,
                                    setSize: setSidebarWidth,
                                    size: sidebarWidth,
                                })
                            }
                        >
                            <div className="absolute inset-y-0 -left-1 -right-1" />
                        </div>
                    </>
                )}

                {/* Editor + Terminal column */}
                <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                    <IdeEditorArea
                        openTabs={openTabs}
                        activeTabId={activeTabId}
                        onTabSelect={setActiveTabId}
                        onTabClose={handleTabClose}
                        onContentChange={handleContentChange}
                    />
                    {terminalOpen && (
                        <IdeTerminalArea
                            projectId={projectId}
                            height={terminalHeight}
                            onResizeStart={(event) =>
                                startPanelResize(event, {
                                    axis: "y",
                                    direction: -1,
                                    max: 520,
                                    min: 120,
                                    setSize: setTerminalHeight,
                                    size: terminalHeight,
                                })
                            }
                        />
                    )}
                </div>
                 {/* AI Chat Panel */}
                {aiOpen && (
                    <>
                        <div
                            className="group relative z-10 h-full w-1 shrink-0 cursor-col-resize bg-border/60 transition-colors hover:bg-violet-400/80"
                            role="separator"
                            aria-orientation="vertical"
                            title="Resize AI chat"
                            onPointerDown={(event) =>
                                startPanelResize(event, {
                                    axis: "x",
                                    direction: -1,
                                    max: 560,
                                    min: 260,
                                    setSize: setAiWidth,
                                    size: aiWidth,
                                })
                            }
                        >
                            <div className="absolute inset-y-0 -left-1 -right-1" />
                        </div>
                        <div
                            className="flex h-full shrink-0 flex-col overflow-hidden"
                            style={{ width: aiWidth }}
                        >
                        <IdeAiChat
                            projectId={projectId}
                            filePath={activeTabId}
                            onClose={() => setAiOpen(false)}
                        />
                        </div>
                    </>
                )}
                {gitOpen && (
                    <>
                        <div
                            className="group relative z-10 h-full w-1 shrink-0 cursor-col-resize bg-border/60 transition-colors hover:bg-primary/70"
                            role="separator"
                            aria-orientation="vertical"
                            title="Resize source control"
                            onPointerDown={(event) =>
                                startPanelResize(event, {
                                    axis: "x",
                                    direction: -1,
                                    max: 640,
                                    min: 300,
                                    setSize: setGitWidth,
                                    size: gitWidth,
                                })
                            }
                        >
                            <div className="absolute inset-y-0 -left-1 -right-1" />
                        </div>
                        <IdeGitPanel
                            projectId={projectId}
                            onClose={() => setGitOpen(false)}
                            onOpenDiff={handleOpenGitDiff}
                            onRepositoryChanged={handleRepositoryChanged}
                            width={gitWidth}
                        />
                    </>
                )}
            </div>
        </div>
    );
}
