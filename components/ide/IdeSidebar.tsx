"use client";

import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react";
import {
    fetchFileTree,
    createFile,
    createFolder,
    deleteNode as apiDeleteNode,
    renameNode as apiRenameNode,
} from "@/services/fileService";
import type { FileNode } from "@/types/fileTree";
import {
    ChevronDown,
    ChevronRight,
    File,
    FilePlus,
    Folder,
    FolderOpen,
    FolderPlus,
    Pencil,
    RefreshCw,
    Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Project } from "@/types/project";


// --------------- Pure immutable tree utilities -------------------

function addNode(
    tree: FileNode[],
    parentId: string | null,
    node: FileNode
): FileNode[] {
    if (parentId === null) return [...tree, node];
    return tree.map((n) => {
        if (n.id === parentId) {
            return { ...n, children: [...(n.children ?? []), node] };
        }
        if (n.children) {
            return { ...n, children: addNode(n.children, parentId, node) };
        }
        return n;
    });
}

function renameNode(
    tree: FileNode[],
    id: string,
    newName: string
): FileNode[] {
    return tree.map((n) => {
        if (n.id === id) return { ...n, name: newName };
        if (n.children) return { ...n, children: renameNode(n.children, id, newName) };
        return n;
    });
}

function deleteNode(tree: FileNode[], id: string): FileNode[] {
    return tree
        .filter((n) => n.id !== id)
        .map((n) =>
            n.children ? { ...n, children: deleteNode(n.children, id) } : n
        );
}

function findNode(tree: FileNode[], id: string): FileNode | null {
    for (const n of tree) {
        if (n.id === id) return n;
        if (n.children) {
            const found = findNode(n.children, id);
            if (found) return found;
        }
    }
    return null;
}

// --------- File extension → colour ------------

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

// ------------- Context --------------

interface CreatingIn {
    parentId: string | null;
    type: "file" | "folder";
}

interface FileTreeCtxType {
    selectedId: string | null;
    expandedIds: Set<string>;
    renamingId: string | null;
    deleteConfirmId: string | null;
    creatingIn: CreatingIn | null;
    // actions
    onSelect: (id: string) => void;
    onToggleExpand: (id: string) => void;
    onStartRename: (id: string) => void;
    onConfirmRename: (id: string, newName: string) => void;
    onCancelRename: () => void;
    onDeleteClick: (id: string) => void;
    onDeleteConfirm: (id: string) => void;
    onDeleteCancel: () => void;
    onStartCreate: (parentId: string | null, type: "file" | "folder") => void;
    onConfirmCreate: (name: string) => void;
    onCancelCreate: () => void;
}

const FileTreeCtx = createContext<FileTreeCtxType | null>(null);

function useFileTree(): FileTreeCtxType {
    const ctx = useContext(FileTreeCtx);
    if (!ctx) throw new Error("useFileTree must be used inside FileTreeCtx.Provider");
    return ctx;
}

// -------- InlineInput --------------

interface InlineInputProps {
    defaultValue?: string;
    placeholder?: string;
    onConfirm: (value: string) => void;
    onCancel: () => void;
}

function InlineInput({
    defaultValue = "",
    placeholder = "Name…",
    onConfirm,
    onCancel,
}: InlineInputProps) {
    const ref = useRef<HTMLInputElement>(null);

    // Auto-focus and select on mount
    useEffect(() => {
        ref.current?.focus();
        ref.current?.select();
    }, []);

    function submit() {
        const value = ref.current?.value.trim() ?? "";
        if (value) onConfirm(value);
        else onCancel();
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Enter") { e.preventDefault(); submit(); }
        if (e.key === "Escape") { e.preventDefault(); onCancel(); }
    }

    return (
        <input
            ref={ref}
            type="text"
            defaultValue={defaultValue}
            placeholder={placeholder}
            onKeyDown={handleKeyDown}
            onBlur={onCancel}
            className="w-full rounded border border-primary/60 bg-background px-1.5 py-0.5 text-xs text-foreground outline-none ring-1 ring-primary/30 placeholder:text-muted-foreground/50"
            onClick={(e) => e.stopPropagation()}
        />
    );
}

// ----- TreeNode -------------

function TreeNode({ node, depth }: { node: FileNode; depth: number }) {
    const ctx = useFileTree();
    const isFolder = node.type === "folder";
    const isExpanded = ctx.expandedIds.has(node.id);
    const isSelected = ctx.selectedId === node.id;
    const isRenaming = ctx.renamingId === node.id;
    const isConfirmingDelete = ctx.deleteConfirmId === node.id;
    const isCreatingInside =
        ctx.creatingIn !== null && ctx.creatingIn.parentId === node.id;

    const indentStyle = { paddingLeft: `${(depth + 1) * 12}px` };
    const childIndentStyle = { paddingLeft: `${(depth + 2) * 12}px` };

    return (
        <div>
            {/* ---- Main row ------------ */}
            {isConfirmingDelete ? (
                // Delete confirmation row ------------
                <div
                    className="flex items-center gap-1.5 rounded bg-destructive/10 py-[5px] pr-2 text-xs"
                    style={indentStyle}
                >
                    <Trash2 className="h-3 w-3 shrink-0 text-destructive" />
                    <span className="flex-1 truncate text-destructive/90">
                        Delete &ldquo;{node.name}&rdquo;?
                    </span>
                    <button
                        className="rounded bg-destructive px-1.5 py-0.5 text-[10px] font-medium text-white hover:opacity-80"
                        onMouseDown={(e) => {
                            e.preventDefault();
                            ctx.onDeleteConfirm(node.id);
                        }}
                    >
                        Delete
                    </button>
                    <button
                        className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-muted"
                        onMouseDown={(e) => {
                            e.preventDefault();
                            ctx.onDeleteCancel();
                        }}
                    >
                        Cancel
                    </button>
                </div>
            ) : (
                // Normal / renaming row ------------
                <div
                    className={cn(
                        "group/node flex items-center gap-1 rounded py-[3px] pr-1 text-xs transition-colors",
                        isSelected
                            ? "bg-primary/15 text-foreground"
                            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                        isFolder ? "cursor-pointer" : "cursor-default"
                    )}
                    style={indentStyle}
                    onClick={() => {
                        if (isFolder) {
                            ctx.onToggleExpand(node.id);
                        } else {
                            ctx.onSelect(node.id);
                        }
                    }}
                >
                    {/* Expand chevron */}
                    <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center">
                        {isFolder ? (
                            isExpanded ? (
                                <ChevronDown className="h-3 w-3" />
                            ) : (
                                <ChevronRight className="h-3 w-3" />
                            )
                        ) : null}
                    </span>

                    {/* File/folder icon */}
                    {isFolder ? (
                        isExpanded ? (
                            <FolderOpen className="h-3.5 w-3.5 shrink-0 text-yellow-500/80" />
                        ) : (
                            <Folder className="h-3.5 w-3.5 shrink-0 text-yellow-500/60" />
                        )
                    ) : (
                        <File className={cn("h-3.5 w-3.5 shrink-0", fileColour(node.name))} />
                    )}

                    {/* Name or inline rename input */}
                    {isRenaming ? (
                        <div
                            className="flex-1 min-w-0 pr-1"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <InlineInput
                                defaultValue={node.name}
                                onConfirm={(v) => ctx.onConfirmRename(node.id, v)}
                                onCancel={ctx.onCancelRename}
                            />
                        </div>
                    ) : (
                        <span className="flex-1 truncate leading-none select-none">
                            {node.name}
                        </span>
                    )}

                    {/* Hover action buttons (hidden until group hover) */}
                    {!isRenaming && (
                        <div
                            className="ml-auto hidden shrink-0 items-center gap-0.5 group-hover/node:flex"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {isFolder && (
                                <>
                                    <button
                                        className="rounded p-0.5 text-muted-foreground/60 hover:bg-muted hover:text-foreground"
                                        title="New file inside"
                                        onClick={() => ctx.onStartCreate(node.id, "file")}
                                    >
                                        <FilePlus className="h-3 w-3" />
                                    </button>
                                    <button
                                        className="rounded p-0.5 text-muted-foreground/60 hover:bg-muted hover:text-foreground"
                                        title="New folder inside"
                                        onClick={() => ctx.onStartCreate(node.id, "folder")}
                                    >
                                        <FolderPlus className="h-3 w-3" />
                                    </button>
                                </>
                            )}
                            <button
                                className="rounded p-0.5 text-muted-foreground/60 hover:bg-muted hover:text-foreground"
                                title="Rename"
                                onClick={() => ctx.onStartRename(node.id)}
                            >
                                <Pencil className="h-3 w-3" />
                            </button>
                            <button
                                className="rounded p-0.5 text-muted-foreground/60 hover:bg-destructive/10 hover:text-destructive"
                                title="Delete"
                                onClick={() => ctx.onDeleteClick(node.id)}
                            >
                                <Trash2 className="h-3 w-3" />
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* ----- Children ---------------- */}
            {isFolder && isExpanded && (
                <div>
                    {node.children?.map((child) => (
                        <TreeNode key={child.id} node={child} depth={depth + 1} />
                    ))}

                    {/* Inline create input at the bottom of this folder's children */}
                    {isCreatingInside && (
                        <div
                            className="flex items-center gap-1.5 py-[3px] pr-2"
                            style={childIndentStyle}
                        >
                            {ctx.creatingIn!.type === "folder" ? (
                                <FolderPlus className="h-3.5 w-3.5 shrink-0 text-yellow-500/70" />
                            ) : (
                                <FilePlus className="h-3.5 w-3.5 shrink-0 text-blue-400/70" />
                            )}
                            <div className="flex-1 min-w-0">
                                <InlineInput
                                    placeholder={
                                        ctx.creatingIn!.type === "folder"
                                            ? "folder-name"
                                            : "file-name.ts"
                                    }
                                    onConfirm={ctx.onConfirmCreate}
                                    onCancel={ctx.onCancelCreate}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ---- IdeSidebar -------------------

interface IdeSidebarProps {
    project: Project;
    open: boolean;
    /** The project ID used to fetch the file tree from the backend. */
    projectId: string;
    /** Called when the user clicks a file node. Opens it in an editor tab. */
    onFileOpen?: (node: FileNode) => void;
}

export function IdeSidebar({ project, open, onFileOpen, projectId }: IdeSidebarProps) {
    const [tree, setTree] = useState<FileNode[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(
        new Set(["src"])
    );
    const [renamingId, setRenamingId] = useState<string | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [creatingIn, setCreatingIn] = useState<CreatingIn | null>(null);

    //Normalize backend uppercase FILE/FOLDER enum to lowercase 
    function normalizeTree(nodes: FileNode[]): FileNode[] {
        return nodes.map((n) => ({
            ...n,
            type: (n.type as string).toLowerCase() as "file" | "folder",
            children: n.children ? normalizeTree(n.children) : undefined,
        }));
    }

    //Load file tree from backend 
    const loadTree = useCallback(async () => {
        try {
            const data = await fetchFileTree(projectId);
            if (data && data.length > 0) {
                setTree(normalizeTree(data));
            }
        } catch {
            console.error("[IDE] Failed to load file tree");
        }
    }, [projectId]);

    useEffect(() => {
        loadTree();
    }, [loadTree]);

    if (!open) return null;

    function clearTransientState() {
        setRenamingId(null);
        setDeleteConfirmId(null);
        setCreatingIn(null);
    }

    const ctx: FileTreeCtxType = {
        selectedId,
        expandedIds,
        renamingId,
        deleteConfirmId,
        creatingIn,

        onSelect: (id) => {
            setSelectedId(id);
            const node = findNode(tree, id);
            if (node && node.type === "file") onFileOpen?.(node);
        },

        onToggleExpand: (id) =>
            setExpandedIds((prev) => {
                const next = new Set(prev);
                next.has(id) ? next.delete(id) : next.add(id);
                return next;
            }),

        onStartRename: (id) => {
            clearTransientState();
            setRenamingId(id);
        },
        onConfirmRename: async (id, newName) => {
            setTree((t) => renameNode(t, id, newName)); // optimistic update
            setRenamingId(null);
            try {
                await apiRenameNode(id, newName);
            } catch (err) {
                console.error("[IDE] Rename failed, reloading tree:", err);
                loadTree(); // rollback by reloading from backend
            }
        },
        onCancelRename: () => setRenamingId(null),

        onDeleteClick: (id) => {
            clearTransientState();
            setDeleteConfirmId(id);
        },
        onDeleteConfirm: async (id) => {
            setTree((t) => deleteNode(t, id)); // optimistic update
            if (selectedId === id) setSelectedId(null);
            setDeleteConfirmId(null);
            try {
                await apiDeleteNode(id);
            } catch (err) {
                console.error("[IDE] Delete failed, reloading tree:", err);
                loadTree(); // rollback by reloading from backend
            }
        },
        onDeleteCancel: () => setDeleteConfirmId(null),

        onStartCreate: (parentId, type) => {
            clearTransientState();
            // Auto-expand the target folder so the inline input is visible
            if (parentId !== null) {
                setExpandedIds((prev) => new Set([...prev, parentId]));
            }
            setCreatingIn({ parentId, type });
        },
        onConfirmCreate: async (name) => {
            if (!name.trim() || !creatingIn) {
                setCreatingIn(null);
                return;
            }

            const targetParentId = creatingIn.parentId;
            const targetType = creatingIn.type;

            setCreatingIn(null);

            try {
                const payload = {
                    projectId,
                    parentId: targetParentId,
                    name: name.trim(),
                };
                const created =
                    targetType === "folder"
                        ? await createFolder(payload)
                        : await createFile(payload);

                if (!created || !created.id) {
                    throw new Error("Backend response missing valid id");
                }

                setTree((t) => {
                    const real: FileNode = {
                        id: created.id,
                        name: created.name,
                        type: (created.type as string).toLowerCase() as "file" | "folder",
                        ...(created.type === "FOLDER" ? { children: [] } : {}),
                    };
                    return addNode(t, targetParentId, real);
                });
            } catch (err) {
                console.error("[IDE] Create failed, reloading tree:", err);
                loadTree(); // rollback
            }
        },
        onCancelCreate: () => setCreatingIn(null),
    };

    return (
        <FileTreeCtx.Provider value={ctx}>
            <aside className="flex h-full w-56 shrink-0 flex-col overflow-hidden border-r border-border bg-card/50">
                {/* ---Header----------------*/}
                <div className="flex items-center justify-between border-b border-border/60 px-3 py-2">
                    <span className="truncate text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        Explorer
                    </span>
                    <div className="flex items-center gap-0.5">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 text-muted-foreground/60 hover:text-foreground"
                            title="New file at root"
                            onClick={() => ctx.onStartCreate(null, "file")}
                        >
                            <FilePlus className="h-3 w-3" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 text-muted-foreground/60 hover:text-foreground"
                            title="New folder at root"
                            onClick={() => ctx.onStartCreate(null, "folder")}
                        >
                            <FolderPlus className="h-3 w-3" />
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

                {/*----- Project label------------- */}
                <div className="border-b border-border/40 px-3 py-1.5">
                    <p className="truncate text-xs font-medium text-foreground/80">
                        {project.name.toUpperCase()}
                    </p>
                </div>

                {/* ----- File tree --------------- */}
                <div className="flex-1 overflow-y-auto py-1">
                    {tree.map((node) => (
                        <TreeNode key={node.id} node={node} depth={0} />
                    ))}

                    {/* Root-level inline create (parentId === null) */}
                    {creatingIn?.parentId === null && (
                        <div
                            className="flex items-center gap-1.5 py-[3px] pr-2"
                            style={{ paddingLeft: "12px" }}
                        >
                            {creatingIn.type === "folder" ? (
                                <FolderPlus className="h-3.5 w-3.5 shrink-0 text-yellow-500/70" />
                            ) : (
                                <FilePlus className="h-3.5 w-3.5 shrink-0 text-blue-400/70" />
                            )}
                            <div className="flex-1 min-w-0">
                                <InlineInput
                                    placeholder={
                                        creatingIn.type === "folder" ? "folder-name" : "file-name.ts"
                                    }
                                    onConfirm={ctx.onConfirmCreate}
                                    onCancel={ctx.onCancelCreate}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </aside>
        </FileTreeCtx.Provider>
    );
}
