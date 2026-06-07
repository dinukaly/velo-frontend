"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Check,
  GitBranch,
  GitCommitHorizontal,
  GitCompare,
  Loader2,
  Plus,
  RefreshCw,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  checkoutGitBranch,
  commitGitChanges,
  createGitBranch,
  fetchGitBranches,
  fetchGitDiff,
  fetchGitLog,
  fetchGitStatus,
  initGitRepository,
  stageGitPaths,
  unstageGitPaths,
} from "@/services/gitService";
import { cn } from "@/lib/utils";
import type { GitBranches, GitCommit, GitDiff, GitFileChange, GitStatus } from "@/types/git";

interface SelectedChange {
  path: string;
  staged: boolean;
}

interface DiffCell {
  lineNumber: number | null;
  text: string;
  changed: boolean;
}

interface DiffRow {
  id: string;
  kind: "context" | "added" | "removed" | "modified" | "hunk";
  oldCell: DiffCell | null;
  newCell: DiffCell | null;
  label?: string;
}

interface IdeGitPanelProps {
  projectId: string;
  onClose: () => void;
  onOpenDiff: (diff: GitDiff, staged: boolean) => void;
  onRepositoryChanged?: () => void;
  width?: number;
}

function statusClass(status: string) {
  switch (status) {
    case "ADDED":
      return "text-green-400";
    case "MODIFIED":
      return "text-amber-400";
    case "DELETED":
      return "text-red-400";
    case "UNTRACKED":
      return "text-blue-400";
    case "CONFLICT":
      return "text-red-300";
    default:
      return "text-muted-foreground";
  }
}

function shortStatus(status: string) {
  const map: Record<string, string> = {
    ADDED: "A",
    MODIFIED: "M",
    DELETED: "D",
    UNTRACKED: "U",
    CONFLICT: "!",
  };
  return map[status] ?? "?";
}

function parseHunkStart(line: string) {
  const match = line.match(/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
  if (!match) return null;
  return {
    oldLine: Number(match[1]),
    newLine: Number(match[2]),
  };
}

function parseUnifiedDiff(diffText: string): DiffRow[] {
  const rows: DiffRow[] = [];
  const pendingRemoved: DiffCell[] = [];
  let oldLine = 0;
  let newLine = 0;
  let rowId = 0;

  function nextId() {
    rowId += 1;
    return String(rowId);
  }

  function flushRemoved() {
    while (pendingRemoved.length > 0) {
      rows.push({
        id: nextId(),
        kind: "removed",
        oldCell: pendingRemoved.shift() ?? null,
        newCell: null,
      });
    }
  }

  for (const line of diffText.split("\n")) {
    if (
      line.startsWith("diff --git") ||
      line.startsWith("index ") ||
      line.startsWith("--- ") ||
      line.startsWith("+++ ")
    ) {
      continue;
    }

    if (line.startsWith("@@")) {
      flushRemoved();
      const hunk = parseHunkStart(line);
      if (hunk) {
        oldLine = hunk.oldLine;
        newLine = hunk.newLine;
      }
      rows.push({
        id: nextId(),
        kind: "hunk",
        oldCell: null,
        newCell: null,
        label: line,
      });
      continue;
    }

    if (line.startsWith("-")) {
      pendingRemoved.push({
        lineNumber: oldLine,
        text: line.slice(1),
        changed: true,
      });
      oldLine += 1;
      continue;
    }

    if (line.startsWith("+")) {
      const removed = pendingRemoved.shift() ?? null;
      rows.push({
        id: nextId(),
        kind: removed ? "modified" : "added",
        oldCell: removed,
        newCell: {
          lineNumber: newLine,
          text: line.slice(1),
          changed: true,
        },
      });
      newLine += 1;
      continue;
    }

    flushRemoved();

    if (line.startsWith(" ") || line === "") {
      const text = line.startsWith(" ") ? line.slice(1) : "";
      rows.push({
        id: nextId(),
        kind: "context",
        oldCell: {
          lineNumber: oldLine,
          text,
          changed: false,
        },
        newCell: {
          lineNumber: newLine,
          text,
          changed: false,
        },
      });
      oldLine += 1;
      newLine += 1;
    }
  }

  flushRemoved();
  return rows;
}

function DiffCellView({ cell, side }: { cell: DiffCell | null; side: "old" | "new" }) {
  const isChanged = Boolean(cell?.changed);
  return (
    <>
      <div
        className={cn(
          "select-none border-r border-white/[0.06] px-2 py-1 text-right font-mono text-[10px] text-muted-foreground/60",
          isChanged && side === "old" && "bg-red-500/10 text-red-300/80",
          isChanged && side === "new" && "bg-green-500/10 text-green-300/80"
        )}
      >
        {cell?.lineNumber ?? ""}
      </div>
      <div
        className={cn(
          "min-w-0 whitespace-pre px-2 py-1 font-mono text-[11px]",
          !cell && "bg-white/[0.02]",
          cell && !isChanged && "text-muted-foreground",
          isChanged && side === "old" && "bg-red-500/10 text-red-200",
          isChanged && side === "new" && "bg-green-500/10 text-green-200"
        )}
      >
        {cell?.text ?? ""}
      </div>
    </>
  );
}

function SideBySideDiff({ diff }: { diff: GitDiff }) {
  const rows = useMemo(() => parseUnifiedDiff(diff.diff), [diff.diff]);

  if (!diff.diff.trim()) {
    return (
      <div className="rounded border border-white/[0.08] bg-white/[0.03] px-3 py-8 text-center text-xs text-muted-foreground">
        No diff available for this file.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded border border-white/[0.08] bg-black/40">
      <div className="grid grid-cols-[3rem_minmax(16rem,1fr)_3rem_minmax(16rem,1fr)] border-b border-white/[0.08] bg-white/[0.04] text-[10px] font-semibold uppercase text-muted-foreground">
        <div className="border-r border-white/[0.06] px-2 py-1.5 text-right">Old</div>
        <div className="px-2 py-1.5">Before</div>
        <div className="border-x border-white/[0.06] px-2 py-1.5 text-right">New</div>
        <div className="px-2 py-1.5">After</div>
      </div>
      <div className="max-h-80 overflow-auto">
        {rows.map((row) =>
          row.kind === "hunk" ? (
            <div
              key={row.id}
              className="border-y border-white/[0.06] bg-primary/10 px-2 py-1 font-mono text-[10px] text-primary"
            >
              {row.label}
            </div>
          ) : (
            <div
              key={row.id}
              className="grid min-w-[46rem] grid-cols-[3rem_minmax(16rem,1fr)_3rem_minmax(16rem,1fr)] border-b border-white/[0.03] last:border-b-0"
            >
              <DiffCellView cell={row.oldCell} side="old" />
              <DiffCellView cell={row.newCell} side="new" />
            </div>
          )
        )}
        {diff.truncated && (
          <div className="border-t border-white/[0.08] px-3 py-2 text-xs text-amber-300">
            Diff truncated
          </div>
        )}
      </div>
    </div>
  );
}

function ChangeRow({
  change,
  selected,
  onSelect,
  onAction,
  actionLabel,
  actionIcon,
}: {
  change: GitFileChange;
  selected: boolean;
  onSelect: () => void;
  onAction: () => void;
  actionLabel: string;
  actionIcon: ReactNode;
}) {
  return (
    <div
      className={cn(
        "group flex w-full items-center rounded text-xs transition-colors",
        selected
          ? "bg-primary/15 text-foreground"
          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
      )}
    >
      <button
        type="button"
        className="flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5 text-left"
        onClick={onSelect}
      >
        <span className={cn("w-4 shrink-0 font-mono text-[10px]", statusClass(change.status))}>
          {shortStatus(change.status)}
        </span>
        <span className="min-w-0 flex-1 truncate">{change.path}</span>
      </button>
      <button
        type="button"
        title={actionLabel}
        className="mr-1 hidden h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground group-hover:flex"
        onClick={(event) => {
          event.stopPropagation();
          onAction();
        }}
      >
        {actionIcon}
      </button>
    </div>
  );
}

function ChangeSection({
  title,
  changes,
  selected,
  staged,
  onSelect,
  onAction,
  onActionAll,
}: {
  title: string;
  changes: GitFileChange[];
  selected: SelectedChange | null;
  staged: boolean;
  onSelect: (change: SelectedChange) => void;
  onAction: (path: string) => void;
  onActionAll: () => void;
}) {
  if (changes.length === 0) return null;

  return (
    <section className="border-b border-white/[0.08] py-2">
      <div className="mb-1 flex items-center justify-between px-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase text-muted-foreground">
            {title}
          </span>
          <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
            {changes.length}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 text-muted-foreground hover:text-foreground"
          title={staged ? "Unstage all" : "Stage all"}
          onClick={onActionAll}
        >
          {staged ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
        </Button>
      </div>
      <div className="space-y-0.5 px-1.5">
        {changes.map((change) => (
          <ChangeRow
            key={`${staged ? "staged" : "unstaged"}-${change.path}-${change.status}`}
            change={change}
            selected={selected?.path === change.path && selected.staged === staged}
            onSelect={() => onSelect({ path: change.path, staged })}
            onAction={() => onAction(change.path)}
            actionLabel={staged ? "Unstage" : "Stage"}
            actionIcon={staged ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
          />
        ))}
      </div>
    </section>
  );
}

export function IdeGitPanel({
  projectId,
  onClose,
  onOpenDiff,
  onRepositoryChanged,
  width = 384,
}: IdeGitPanelProps) {
  const [status, setStatus] = useState<GitStatus | null>(null);
  const [branches, setBranches] = useState<GitBranches | null>(null);
  const [log, setLog] = useState<GitCommit[]>([]);
  const [selectedChange, setSelectedChange] = useState<SelectedChange | null>(null);
  const [diff, setDiff] = useState<GitDiff | null>(null);
  const [commitMessage, setCommitMessage] = useState("");
  const [newBranchName, setNewBranchName] = useState("");
  const [loading, setLoading] = useState(true);
  const [diffLoading, setDiffLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const unstagedChanges = useMemo(() => {
    if (!status) return [];
    return [...status.unstagedChanges, ...status.untrackedFiles, ...status.conflictingFiles];
  }, [status]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const nextStatus = await fetchGitStatus(projectId);
      setStatus(nextStatus);
      if (nextStatus.repositoryInitialized) {
        const [nextBranches, nextLog] = await Promise.all([
          fetchGitBranches(projectId),
          fetchGitLog(projectId, 10),
        ]);
        setBranches(nextBranches);
        setLog(nextLog);
      } else {
        setBranches(null);
        setLog([]);
      }
    } catch (error) {
      console.error("[Git] Failed to refresh status:", error);
      toast.error("Failed to load Git status");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    async function loadDiff() {
      if (!selectedChange || !status?.repositoryInitialized) {
        setDiff(null);
        return;
      }
      setDiffLoading(true);
      try {
        const nextDiff = await fetchGitDiff(
          projectId,
          selectedChange.path,
          selectedChange.staged
        );
        setDiff(nextDiff);
        onOpenDiff(nextDiff, selectedChange.staged);
      } catch (error) {
        console.error("[Git] Failed to load diff:", error);
        toast.error("Failed to load diff");
      } finally {
        setDiffLoading(false);
      }
    }
    loadDiff();
  }, [onOpenDiff, projectId, selectedChange, status?.repositoryInitialized]);

  async function initializeRepository() {
    setBusy(true);
    try {
      const nextStatus = await initGitRepository(projectId);
      setStatus(nextStatus);
      toast.success("Git repository initialized");
      await refresh();
    } catch (error) {
      console.error("[Git] Init failed:", error);
      toast.error("Failed to initialize Git");
    } finally {
      setBusy(false);
    }
  }

  async function stagePaths(paths: string[]) {
    setBusy(true);
    try {
      setStatus(await stageGitPaths(projectId, paths));
      toast.success(paths.length === 1 ? "Staged file" : "Staged changes");
      await refresh();
    } catch (error) {
      console.error("[Git] Stage failed:", error);
      toast.error("Failed to stage changes");
    } finally {
      setBusy(false);
    }
  }

  async function unstagePaths(paths: string[]) {
    setBusy(true);
    try {
      setStatus(await unstageGitPaths(projectId, paths));
      toast.success(paths.length === 1 ? "Unstaged file" : "Unstaged changes");
      await refresh();
    } catch (error) {
      console.error("[Git] Unstage failed:", error);
      toast.error("Failed to unstage changes");
    } finally {
      setBusy(false);
    }
  }

  async function commit() {
    const message = commitMessage.trim();
    if (!message) return;

    setBusy(true);
    try {
      await commitGitChanges(projectId, message);
      setCommitMessage("");
      setSelectedChange(null);
      setDiff(null);
      toast.success("Commit created");
      await refresh();
    } catch (error) {
      console.error("[Git] Commit failed:", error);
      toast.error("Failed to commit changes");
    } finally {
      setBusy(false);
    }
  }

  async function createBranch() {
    const name = newBranchName.trim();
    if (!name) return;

    setBusy(true);
    try {
      setBranches(await createGitBranch(projectId, name, true));
      setNewBranchName("");
      toast.success("Branch created");
      onRepositoryChanged?.();
      await refresh();
    } catch (error) {
      console.error("[Git] Create branch failed:", error);
      toast.error("Failed to create branch");
    } finally {
      setBusy(false);
    }
  }

  async function checkoutBranch(branch: string) {
    if (!branch || branch === branches?.currentBranch) return;

    setBusy(true);
    try {
      setBranches(await checkoutGitBranch(projectId, branch));
      setSelectedChange(null);
      setDiff(null);
      toast.success(`Checked out ${branch}`);
      onRepositoryChanged?.();
      await refresh();
    } catch (error) {
      console.error("[Git] Checkout failed:", error);
      toast.error("Failed to checkout branch");
    } finally {
      setBusy(false);
    }
  }

  const hasStagedChanges = Boolean(status?.stagedChanges.length);

  return (
    <aside
      className="flex h-full shrink-0 flex-col overflow-hidden border-l border-white/[0.08] bg-[#0d0d0f]"
      style={{ width }}
    >
      <div className="flex h-10 shrink-0 items-center gap-2 border-b border-white/[0.08] px-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/15 text-primary">
            <GitBranch className="h-3 w-3" />
          </div>
          <span className="text-xs font-semibold text-foreground">Source Control</span>
          {branches?.currentBranch && (
            <Badge variant="outline" className="max-w-[140px] truncate text-[10px]">
              {branches.currentBranch}
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-foreground"
          title="Refresh Git status"
          onClick={refresh}
          disabled={loading || busy}
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-foreground"
          title="Close source control"
          onClick={onClose}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {loading && !status ? (
        <div className="flex flex-1 items-center justify-center text-xs text-muted-foreground">
          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
          Loading Git status...
        </div>
      ) : !status?.repositoryInitialized ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-white/[0.08] text-muted-foreground">
            <GitBranch className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">No repository yet</p>
            <p className="text-xs text-muted-foreground">
              Initialize Git for this workspace to start tracking changes.
            </p>
          </div>
          <Button size="sm" className="h-8 text-xs" onClick={initializeRepository} disabled={busy}>
            {busy ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
            Initialize Repository
          </Button>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="shrink-0 border-b border-white/[0.08] p-3">
            <div className="mb-2 flex items-center gap-2">
              <select
                value={branches?.currentBranch ?? ""}
                onChange={(event) => checkoutBranch(event.target.value)}
                disabled={busy || !branches?.branches.length}
                className="h-7 min-w-0 flex-1 rounded border border-white/[0.08] bg-white/[0.04] px-2 text-xs text-foreground outline-none focus:border-primary/60"
                title="Checkout branch"
              >
                {branches?.branches.map((branch) => (
                  <option key={branch} value={branch}>
                    {branch}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <input
                value={newBranchName}
                onChange={(event) => setNewBranchName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") createBranch();
                }}
                placeholder="new-branch"
                className="h-7 min-w-0 flex-1 rounded border border-white/[0.08] bg-white/[0.04] px-2 text-xs text-foreground outline-none placeholder:text-muted-foreground/50 focus:border-primary/60"
                disabled={busy}
              />
              <Button
                variant="secondary"
                size="icon"
                className="h-7 w-7"
                title="Create and checkout branch"
                onClick={createBranch}
                disabled={busy || !newBranchName.trim()}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-auto">
            <ChangeSection
              title="Staged"
              changes={status.stagedChanges}
              selected={selectedChange}
              staged
              onSelect={setSelectedChange}
              onAction={(path) => unstagePaths([path])}
              onActionAll={() => unstagePaths([])}
            />
            <ChangeSection
              title="Changes"
              changes={unstagedChanges}
              selected={selectedChange}
              staged={false}
              onSelect={setSelectedChange}
              onAction={(path) => stagePaths([path])}
              onActionAll={() => stagePaths([])}
            />

            {status.clean && (
              <div className="flex items-center gap-2 border-b border-white/[0.08] px-3 py-4 text-xs text-muted-foreground">
                <Check className="h-3.5 w-3.5 text-green-400" />
                Working tree clean
              </div>
            )}

            <section className="border-b border-white/[0.08] p-3">
              <div className="mb-2 flex items-center gap-2">
                <GitCommitHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[11px] font-semibold uppercase text-muted-foreground">
                  Commit
                </span>
              </div>
              <Textarea
                value={commitMessage}
                onChange={(event) => setCommitMessage(event.target.value)}
                placeholder="Commit message"
                rows={3}
                className="min-h-[76px] resize-none bg-white/[0.04] text-xs"
                disabled={busy}
              />
              <Button
                size="sm"
                className="mt-2 h-7 w-full text-xs"
                onClick={commit}
                disabled={busy || !commitMessage.trim() || !hasStagedChanges}
              >
                {busy ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
                Commit Staged Changes
              </Button>
            </section>

            <section className="border-b border-white/[0.08] p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {diffLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <GitCompare className="h-3.5 w-3.5" />
                )}
                <span>
                  {diffLoading
                    ? "Opening diff..."
                    : diff
                      ? "Diff opened in the editor."
                      : "Select a changed file to open its diff."}
                </span>
              </div>
            </section>

            {log.length > 0 && (
              <section className="p-3">
                <span className="text-[11px] font-semibold uppercase text-muted-foreground">
                  Recent Commits
                </span>
                <div className="mt-2 space-y-2">
                  {log.map((commit) => (
                    <div key={commit.id} className="text-xs">
                      <div className="truncate text-foreground">{commit.message}</div>
                      <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                        {commit.shortId}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
