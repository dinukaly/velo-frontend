"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { GitDiff } from "@/types/git";

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
          "select-none border-r border-white/[0.06] px-2 py-1 text-right font-mono text-[11px] text-muted-foreground/60",
          isChanged && side === "old" && "bg-red-500/10 text-red-300/80",
          isChanged && side === "new" && "bg-green-500/10 text-green-300/80"
        )}
      >
        {cell?.lineNumber ?? ""}
      </div>
      <div
        className={cn(
          "min-w-0 whitespace-pre px-3 py-1 font-mono text-xs leading-5",
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

export function GitDiffViewer({ diff }: { diff: GitDiff }) {
  const rows = useMemo(() => parseUnifiedDiff(diff.diff), [diff.diff]);

  if (!diff.diff.trim()) {
    return (
      <div className="flex flex-1 items-center justify-center bg-background text-xs text-muted-foreground">
        No diff available for this file.
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background">
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-border bg-card/40 px-3">
        <div className="min-w-0 truncate text-xs font-medium text-foreground">
          {diff.path ?? "Working tree diff"}
        </div>
        {diff.truncated && (
          <div className="shrink-0 text-[10px] uppercase text-amber-300">Diff truncated</div>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <div className="min-w-[64rem]">
          <div className="sticky top-0 z-10 grid grid-cols-[4rem_minmax(24rem,1fr)_4rem_minmax(24rem,1fr)] border-b border-border bg-card text-[10px] font-semibold uppercase text-muted-foreground">
            <div className="border-r border-border px-2 py-2 text-right">Old</div>
            <div className="px-3 py-2">Before</div>
            <div className="border-x border-border px-2 py-2 text-right">New</div>
            <div className="px-3 py-2">After</div>
          </div>
          {rows.map((row) =>
            row.kind === "hunk" ? (
              <div
                key={row.id}
                className="border-y border-border bg-primary/10 px-3 py-1 font-mono text-[11px] text-primary"
              >
                {row.label}
              </div>
            ) : (
              <div
                key={row.id}
                className="grid grid-cols-[4rem_minmax(24rem,1fr)_4rem_minmax(24rem,1fr)] border-b border-white/[0.03] last:border-b-0"
              >
                <DiffCellView cell={row.oldCell} side="old" />
                <DiffCellView cell={row.newCell} side="new" />
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
