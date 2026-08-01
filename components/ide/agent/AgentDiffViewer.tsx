"use client";

/**
 * AgentDiffViewer.tsx
 *
 * Diff viewer for the proposal review panel.
 *
 * Renders a unified diff for each hunk with:
 * - Green (+) / red (-) line colouring
 * - Accept / Reject buttons per hunk
 * - Dependency-group badge (shows when hunks share a changeGroupKey)
 * - Decision badge overlay (ACCEPTED / REJECTED / SKIPPED) for decided hunks
 * - File-level rationale header
 */

import { useState } from "react";
import { Check, X, Link2, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { ProposalFile, ProposalHunk, HunkDecision } from "@/types/agent";

interface AgentDiffViewerProps {
  files: ProposalFile[];
  onDecide: (hunkId: string, decision: HunkDecision) => Promise<void>;
  disabled?: boolean;
}

// ── Hunk diff renderer ────────────────────────────────────────────

function DiffLines({ snippet }: { snippet: string }) {
  const lines = snippet.split("\n");
  return (
    <div className="font-mono text-[10px] leading-5 overflow-x-auto">
      {lines.map((line, i) => {
        if (line.startsWith("---") || line.startsWith("+++")) {
          return (
            <div key={i} className="text-muted-foreground/40 px-2 select-none">
              {line}
            </div>
          );
        }
        if (line.startsWith("@@")) {
          return (
            <div key={i} className="text-cyan-400/70 px-2 bg-cyan-900/10 select-none">
              {line}
            </div>
          );
        }
        if (line.startsWith("+")) {
          return (
            <div key={i} className="bg-emerald-500/10 text-emerald-300 px-2">
              {line}
            </div>
          );
        }
        if (line.startsWith("-")) {
          return (
            <div key={i} className="bg-red-500/10 text-red-300 px-2">
              {line}
            </div>
          );
        }
        return (
          <div key={i} className="text-foreground/70 px-2">
            {line || " "}
          </div>
        );
      })}
    </div>
  );
}

// ── Decision badge ────────────────────────────────────────────────

function DecisionBadge({ decision }: { decision: HunkDecision }) {
  if (decision === "PENDING") return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold border",
        decision === "ACCEPTED" && "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
        decision === "REJECTED" && "bg-red-500/15 text-red-400 border-red-500/30",
        decision === "SKIPPED" && "bg-muted/30 text-muted-foreground border-white/10"
      )}
    >
      {decision === "ACCEPTED" && <Check className="h-2.5 w-2.5" />}
      {decision === "REJECTED" && <X className="h-2.5 w-2.5" />}
      {decision.charAt(0) + decision.slice(1).toLowerCase()}
    </span>
  );
}

// ── Single hunk card ──────────────────────────────────────────────

function HunkCard({
  hunk,
  onDecide,
  disabled,
}: {
  hunk: ProposalHunk;
  onDecide: (hunkId: string, decision: HunkDecision) => Promise<void>;
  disabled?: boolean;
}) {
  const [deciding, setDeciding] = useState<HunkDecision | null>(null);

  async function handle(decision: HunkDecision) {
    if (hunk.decision !== "PENDING") return;
    setDeciding(decision);
    try {
      await onDecide(hunk.id, decision);
    } finally {
      setDeciding(null);
    }
  }

  const isPending = hunk.decision === "PENDING";

  return (
    <div
      className={cn(
        "rounded-lg border overflow-hidden transition-colors",
        hunk.decision === "ACCEPTED" && "border-emerald-500/30 bg-emerald-500/5",
        hunk.decision === "REJECTED" && "border-red-500/20 bg-red-500/5",
        hunk.decision === "SKIPPED" && "border-white/[0.06] opacity-50",
        hunk.decision === "PENDING" && "border-white/[0.08] bg-white/[0.02]"
      )}
    >
      {/* Hunk header */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-white/[0.06]">
        <div className="flex items-center gap-2 min-w-0">
          {hunk.changeGroupKey && (
            <span className="flex items-center gap-1 text-[10px] text-cyan-400/70 shrink-0">
              <Link2 className="h-3 w-3" />
              group: {hunk.changeGroupKey}
            </span>
          )}
          <span className="text-[11px] text-foreground/80 truncate">
            {hunk.label || `Lines ${hunk.originalStartLine}–${hunk.originalEndLine}`}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <DecisionBadge decision={hunk.decision} />
          {isPending && (
            <>
              <Button
                size="sm"
                variant="ghost"
                disabled={!!deciding || disabled}
                onClick={() => handle("ACCEPTED")}
                className="h-6 px-2 text-[11px] text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20 transition-all"
              >
                {deciding === "ACCEPTED" ? (
                  <span className="flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded-full border border-emerald-400 border-t-transparent animate-spin" />
                    …
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Check className="h-3 w-3" /> Accept
                  </span>
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={!!deciding || disabled}
                onClick={() => handle("REJECTED")}
                className="h-6 px-2 text-[11px] text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"
              >
                {deciding === "REJECTED" ? (
                  <span className="flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded-full border border-red-400 border-t-transparent animate-spin" />
                    …
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <X className="h-3 w-3" /> Reject
                  </span>
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Diff content */}
      <div className="bg-black/30 max-h-[280px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
        <DiffLines snippet={hunk.diffSnippet} />
      </div>
    </div>
  );
}

// ── File section ──────────────────────────────────────────────────

function FileSection({
  file,
  onDecide,
  disabled,
}: {
  file: ProposalFile;
  onDecide: (hunkId: string, decision: HunkDecision) => Promise<void>;
  disabled?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(false);

  const pendingCount = file.hunks.filter((h) => h.decision === "PENDING").length;

  const changeTypeBadge: Record<string, string> = {
    CREATE: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    MODIFY: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    DELETE: "text-red-400 bg-red-500/10 border-red-500/20",
    RENAME: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  };

  return (
    <div className="rounded-xl border border-white/[0.08] overflow-hidden">
      {/* File header */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center gap-2 px-3 py-2.5 bg-white/[0.03] hover:bg-white/[0.05] transition-colors text-left"
      >
        {collapsed ? (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        )}
        <span
          className={cn(
            "text-[10px] px-1.5 py-0.5 rounded border font-semibold shrink-0",
            changeTypeBadge[file.changeType] ?? "text-muted-foreground border-white/10"
          )}
        >
          {file.changeType}
        </span>
        <span className="flex-1 text-[11px] font-mono text-foreground/90 truncate">
          {file.filePath}
          {file.newFilePath && (
            <span className="text-muted-foreground"> → {file.newFilePath}</span>
          )}
        </span>
        {pendingCount > 0 && (
          <span className="text-[10px] text-amber-400 shrink-0">
            {pendingCount} pending
          </span>
        )}
      </button>

      {/* Rationale */}
      {!collapsed && file.rationale && (
        <div className="px-3 py-1.5 text-[10px] text-muted-foreground/70 bg-white/[0.01] border-b border-white/[0.06] italic">
          {file.rationale}
        </div>
      )}

      {/* Hunks */}
      {!collapsed && (
        <div className="flex flex-col gap-2 p-3">
          {file.hunks.map((hunk) => (
            <HunkCard key={hunk.id} hunk={hunk} onDecide={onDecide} disabled={disabled} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────

export function AgentDiffViewer({ files, onDecide, disabled }: AgentDiffViewerProps) {
  if (!files || files.length === 0) {
    return (
      <div className="flex items-center justify-center py-10 text-[11px] text-muted-foreground">
        No file changes in this proposal.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {files.map((file) => (
        <FileSection key={file.id} file={file} onDecide={onDecide} disabled={disabled} />
      ))}
    </div>
  );
}
