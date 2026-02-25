"use client";

import { useState } from "react";
import {
    ChevronDown,
    ChevronRight,
    File,
    Folder,
    FolderOpen,
    Plus,
    RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Project } from "@/types/project";

// ---- Mock file tree -------------------

interface FileNode {
    name: string;
    type: "file" | "folder";
    children?: FileNode[];
}

const MOCK_FILE_TREE: FileNode[] = [
    {
        name: "src",
        type: "folder",
        children: [
            { name: "index.ts", type: "file" },
            { name: "app.ts", type: "file" },
            {
                name: "utils",
                type: "folder",
                children: [
                    { name: "helpers.ts", type: "file" },
                    { name: "logger.ts", type: "file" },
                ],
            },
            {
                name: "types",
                type: "folder",
                children: [{ name: "index.d.ts", type: "file" }],
            },
        ],
    },
    {
        name: "tests",
        type: "folder",
        children: [
            { name: "app.test.ts", type: "file" },
        ],
    },
    { name: "package.json", type: "file" },
    { name: "tsconfig.json", type: "file" },
    { name: ".env", type: "file" },
    { name: "README.md", type: "file" },
];

// ---- File extension → colour -------------------

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

// ---- Tree node component -------------------

function TreeNode({
    node,
    depth = 0,
}: {
    node: FileNode;
    depth?: number;
}) {
    const [expanded, setExpanded] = useState(depth < 1);
    const isFolder = node.type === "folder";

    return (
        <div>
            <button
                type="button"
                onClick={() => isFolder && setExpanded((v) => !v)}
                className={cn(
                    "group flex w-full items-center gap-1.5 rounded px-2 py-[3px] text-left text-xs transition-colors",
                    "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                    isFolder ? "cursor-pointer" : "cursor-default"
                )}
                style={{ paddingLeft: `${(depth + 1) * 12}px` }}
            >
                {/* Expand chevron (folders only) */}
                {isFolder ? (
                    <span className="shrink-0 text-muted-foreground/60">
                        {expanded ? (
                            <ChevronDown className="h-3 w-3" />
                        ) : (
                            <ChevronRight className="h-3 w-3" />
                        )}
                    </span>
                ) : (
                    <span className="h-3 w-3 shrink-0" />
                )}

                {/* Icon */}
                {isFolder ? (
                    expanded ? (
                        <FolderOpen className="h-3.5 w-3.5 shrink-0 text-yellow-500/80" />
                    ) : (
                        <Folder className="h-3.5 w-3.5 shrink-0 text-yellow-500/60" />
                    )
                ) : (
                    <File className={cn("h-3.5 w-3.5 shrink-0", fileColour(node.name))} />
                )}

                <span className="truncate leading-none">{node.name}</span>
            </button>

            {/* Children */}
            {isFolder && expanded && node.children && (
                <div>
                    {node.children.map((child) => (
                        <TreeNode key={child.name} node={child} depth={depth + 1} />
                    ))}
                </div>
            )}
        </div>
    );
}

// ---- Sidebar root -------------------

interface IdeSidebarProps {
    project: Project;
    open: boolean;
}

export function IdeSidebar({ project, open }: IdeSidebarProps) {
    if (!open) return null;

    return (
        <aside className="flex h-full w-56 shrink-0 flex-col overflow-hidden border-r border-border bg-card/50">
            {/* Sidebar header */}
            <div className="flex items-center justify-between border-b border-border/60 px-3 py-2">
                <span className="truncate text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Explorer
                </span>
                <div className="flex items-center gap-0.5">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 text-muted-foreground/60 hover:text-foreground"
                        title="New file (coming soon)"
                        disabled
                    >
                        <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 text-muted-foreground/60 hover:text-foreground"
                        title="Refresh (coming soon)"
                        disabled
                    >
                        <RefreshCw className="h-3 w-3" />
                    </Button>
                </div>
            </div>

            {/* Project name */}
            <div className="border-b border-border/40 px-3 py-1.5">
                <p className="truncate text-xs font-medium text-foreground/80">
                    {project.name.toUpperCase()}
                </p>
            </div>

            {/* File tree */}
            <div className="flex-1 overflow-y-auto py-1">
                {MOCK_FILE_TREE.map((node) => (
                    <TreeNode key={node.name} node={node} depth={0} />
                ))}
            </div>
        </aside>
    );
}
