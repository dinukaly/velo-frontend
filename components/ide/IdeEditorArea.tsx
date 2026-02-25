"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { Code2, X, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FileTab } from "@/types/fileTab";
import type { OnMount } from "@monaco-editor/react";
import type { editor as MonacoEditorNs, editor } from "monaco-editor";

/**
 * Monaco is loaded client-side only via CDN workers.
 * The `loading` fallback is shown until the bundle is ready.
 */
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
    ssr: false,
    loading: () => (
        <div className="flex flex-1 items-center justify-center text-xs text-muted-foreground">
            Loading editor…
        </div>
    ),
});

// ----- File extension → icon colour -------

function fileColour(name: string): string {
    const ext = name.split(".").pop() ?? "";
    const map: Record<string, string> = {
        ts: "text-blue-400",
        tsx: "text-blue-400",
        js: "text-yellow-400",
        jsx: "text-yellow-400",
        py: "text-green-400",
        go: "text-cyan-400",
        rs: "text-orange-400",
        java: "text-red-400",
        json: "text-amber-400",
        md: "text-slate-400",
        env: "text-emerald-400",
        "d.ts": "text-indigo-400",
    };
    return map[ext] ?? "text-muted-foreground";
}

// ------------ Tab bar ----------

interface TabBarProps {
    tabs: FileTab[];
    activeTabId: string | null;
    onTabSelect: (id: string) => void;
    onTabClose: (id: string) => void;
}

function TabBar({ tabs, activeTabId, onTabSelect, onTabClose }: TabBarProps) {
    if (tabs.length === 0) return null;

    return (
        <div className="flex h-9 shrink-0 items-end overflow-x-auto border-b border-border bg-card/60 scrollbar-none">
            {tabs.map((tab) => {
                const isActive = tab.id === activeTabId;
                return (
                    <div
                        key={tab.id}
                        className={cn(
                            "group/tab relative flex items-center gap-1.5 border-r border-border px-3 py-1.5 text-xs transition-colors cursor-pointer select-none shrink-0",
                            isActive
                                ? "bg-background text-foreground"
                                : "bg-transparent text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                        )}
                        onClick={() => onTabSelect(tab.id)}
                    >
                        {/* Active tab indicator bar */}
                        {isActive && (
                            <div className="absolute inset-x-0 top-0 h-[2px] bg-primary rounded-b-none" />
                        )}

                        {/* File colour dot */}
                        <span className={cn("text-[10px]", fileColour(tab.name))}>●</span>

                        {/* Filename */}
                        <span className="leading-none">{tab.name}</span>

                        {/* Dirty indicator or close button */}
                        <button
                            className={cn(
                                "flex h-3.5 w-3.5 items-center justify-center rounded-sm transition-opacity",
                                tab.isDirty
                                    ? "text-primary opacity-100"
                                    : "opacity-0 group-hover/tab:opacity-100 text-muted-foreground hover:text-foreground hover:bg-muted"
                            )}
                            onClick={(e) => {
                                e.stopPropagation();
                                onTabClose(tab.id);
                            }}
                            title={tab.isDirty ? "Unsaved changes — click to close" : "Close tab"}
                        >
                            {tab.isDirty ? (
                                <Circle className="h-2 w-2 fill-current" />
                            ) : (
                                <X className="h-2.5 w-2.5" />
                            )}
                        </button>
                    </div>
                );
            })}
        </div>
    );
}

// ------------ IdeEditorArea ----------

interface IdeEditorAreaProps {
    openTabs: FileTab[];
    activeTabId: string | null;
    onTabSelect: (id: string) => void;
    onTabClose: (id: string) => void;
    onContentChange: (id: string, content: string) => void;
}

export function IdeEditorArea({
    openTabs,
    activeTabId,
    onTabSelect,
    onTabClose,
    onContentChange,
}: IdeEditorAreaProps) {
    /** Reference to the Monaco editor instance — persists across tab switches. */
    const editorRef = useRef<MonacoEditorNs.IStandaloneCodeEditor | null>(null);
    /** Reference to the Monaco namespace — needed for setModelLanguage. */
    const monacoRef = useRef<typeof import("monaco-editor") | null>(null);
    /** Stable ref that always holds the latest activeTabId for the change handler. */
    const activeTabIdRef = useRef<string | null>(activeTabId);

    const activeTab = openTabs.find((t) => t.id === activeTabId) ?? null;

    // Keep the activeTabIdRef in sync
    useEffect(() => {
        activeTabIdRef.current = activeTabId;
    }, [activeTabId]);

    // When the active tab changes: update content + language in the existing editor
    useEffect(() => {
        const editor = editorRef.current;
        const monacoInst = monacoRef.current;
        if (!editor || !activeTab) return;

        // Update content only if it differs (avoids cursor jump on re-render)
        if (editor.getValue() !== activeTab.content) {
            editor.setValue(activeTab.content);
        }

        // Update language model
        const model = editor.getModel();
        if (model && monacoInst) {
            monacoInst.editor.setModelLanguage(model, activeTab.language);
        }

        // Move cursor to top of file on tab switch
        editor.setScrollTop(0);
        editor.setPosition({ lineNumber: 1, column: 1 });
        editor.focus();
    }, [activeTabId]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleMount: OnMount = (editor, monaco) => {
        editorRef.current = editor;
        monacoRef.current = monaco as unknown as typeof import("monaco-editor");

        // Load initial content
        if (activeTab) {
            editor.setValue(activeTab.content);
            const model = editor.getModel();
            if (model) {
                (monaco as unknown as typeof import("monaco-editor")).editor.setModelLanguage(
                    model,
                    activeTab.language
                );
            }
        }

        // Track content changes for dirty state
        editor.onDidChangeModelContent(() => {
            const tabId = activeTabIdRef.current;
            if (tabId) {
                onContentChange(tabId, editor.getValue());
            }
        });
    };

    // -------- Placeholder — shown when no tabs are open ------------------------
    if (openTabs.length === 0) {
        return (
            <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-background">
                {/* Dot-grid background */}
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage:
                            "radial-gradient(circle, currentColor 1px, transparent 1px)",
                        backgroundSize: "24px 24px",
                    }}
                />
                <div className="relative flex flex-col items-center gap-4 text-center px-8">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-card text-muted-foreground/40">
                        <Code2 className="h-8 w-8" />
                    </div>
                    <div className="space-y-1.5">
                        <p className="text-sm font-medium text-muted-foreground">
                            No file open
                        </p>
                        <p className="text-xs text-muted-foreground/60">
                            Click a file in the explorer to start editing.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // ----- Editor -----------------------
    return (
        <div className="flex flex-1 flex-col overflow-hidden">
            {/* Tab bar */}
            <TabBar
                tabs={openTabs}
                activeTabId={activeTabId}
                onTabSelect={onTabSelect}
                onTabClose={onTabClose}
            />

            {/* Monaco Editor — mounted once, content swapped on tab change */}
            <div className="flex-1 overflow-hidden">
                <MonacoEditor
                    height="100%"
                    theme="vs-dark"
                    defaultValue="// Loading…"
                    onMount={handleMount}
                    options={{
                        fontSize: 13,
                        fontFamily:
                            "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Menlo, Consolas, monospace",
                        fontLigatures: true,
                        lineHeight: 21,
                        letterSpacing: 0.3,
                        padding: { top: 14, bottom: 14 },
                        minimap: { enabled: true, scale: 1 },
                        scrollBeyondLastLine: false,
                        renderLineHighlight: "all",
                        cursorBlinking: "smooth",
                        cursorSmoothCaretAnimation: "on",
                        smoothScrolling: true,
                        tabSize: 2,
                        wordWrap: "on",
                        bracketPairColorization: { enabled: true },
                        guides: { bracketPairs: "active" },
                        mouseWheelZoom: true,
                        contextmenu: true,
                        formatOnPaste: true,
                        formatOnType: true,
                        automaticLayout: true,
                    }}
                />
            </div>
        </div>
    );
}
