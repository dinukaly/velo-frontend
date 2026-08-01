"use client";

/**
 * IdeAgentPanel.tsx
 *
 * The full Agent-mode panel mounted in the IDE's right sidebar.
 *
 * Sections:
 * 1. Mode toggle — switches between Chat and Agent tabs.
 * 2. Agent input — text area + Send to create a new run.
 * 3. Run status bar — shows current status pill and cancel button.
 * 4. Progress timeline — live steps from SSE (AgentProgressPanel).
 * 5. Proposal review — diff viewer + per-hunk decisions (AgentDiffViewer).
 *
 * State is fully managed by agentStore + useAgentSse hook.
 */

import { useState, useRef, useCallback } from "react";
import {
  Bot,
  Send,
  X,
  Sparkles,
  Loader2,
  Terminal,
  MessageSquare,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAgentStore } from "@/store/agentStore";
import { useAgentSse } from "@/hooks/useAgentSse";
import { createAgentRun, cancelAgentRun, decideHunk } from "@/services/agentService";
import { AgentProgressPanel } from "./agent/AgentProgressPanel";
import { AgentDiffViewer } from "./agent/AgentDiffViewer";
import type { AgentPanelMode, AgentRunStatus, HunkDecision } from "@/types/agent";

export interface IdeAgentPanelProps {
  projectId: string;
  filePath: string | null;
  selectedCode?: string;
  onClose: () => void;
  /** Callback to switch parent panel back to Chat mode */
  onSwitchToChat?: () => void;
}

// ── Status pill helpers ───────────────────────────────────────────

const STATUS_LABELS: Partial<Record<AgentRunStatus, string>> = {
  QUEUED: "Queued",
  RUNNING: "Running",
  WAITING_FOR_APPROVAL: "Review Required",
  APPLYING: "Applying…",
  VERIFYING: "Verifying…",
  DONE: "Done",
  FAILED: "Failed",
  CANCELED: "Canceled",
  REJECTED: "Rejected",
  CONFLICTED: "Conflict",
};

function StatusPill({ status }: { status: AgentRunStatus }) {
  const label = STATUS_LABELS[status] ?? status;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border",
        status === "RUNNING" && "bg-violet-500/15 text-violet-400 border-violet-500/30",
        status === "QUEUED" && "bg-blue-500/15 text-blue-400 border-blue-500/30",
        status === "WAITING_FOR_APPROVAL" &&
          "bg-amber-500/15 text-amber-400 border-amber-500/30",
        status === "APPLYING" && "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
        status === "VERIFYING" && "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
        status === "DONE" && "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
        (status === "FAILED" || status === "CONFLICTED") &&
          "bg-red-500/15 text-red-400 border-red-500/30",
        (status === "CANCELED" || status === "REJECTED") &&
          "bg-muted/30 text-muted-foreground border-white/10"
      )}
    >
      {(status === "RUNNING" || status === "APPLYING" || status === "VERIFYING") && (
        <Loader2 className="h-2.5 w-2.5 animate-spin" />
      )}
      {status === "DONE" && <CheckCircle2 className="h-2.5 w-2.5" />}
      {(status === "FAILED" || status === "CONFLICTED") && (
        <AlertCircle className="h-2.5 w-2.5" />
      )}
      {label}
    </span>
  );
}

// ── Main Component ────────────────────────────────────────────────

export function IdeAgentPanel({
  projectId,
  filePath,
  selectedCode,
  onClose,
  onSwitchToChat,
}: IdeAgentPanelProps) {
  // ── Panel mode toggle ──────────────────────────────────────────
  const [mode, setMode] = useState<AgentPanelMode>("agent");

  // ── Input ──────────────────────────────────────────────────────
  const [input, setInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Agent store ────────────────────────────────────────────────
  const {
    run,
    runStatus,
    steps,
    proposal,
    warnings,
    sseConnected,
    setRun,
    setProposal,
    updateHunkDecision,
    reset,
  } = useAgentStore();

  // ── SSE ────────────────────────────────────────────────────────
  useAgentSse({ runId: run?.id ?? null });

  // ── Derived state ──────────────────────────────────────────────
  const isActive =
    runStatus &&
    !["DONE", "FAILED", "CANCELED", "REJECTED", "CONFLICTED"].includes(runStatus);

  const isWaitingReview = runStatus === "WAITING_FOR_APPROVAL";

  const pendingHunks =
    proposal?.files.flatMap((f) => f.hunks.filter((h) => h.decision === "PENDING")).length ?? 0;

  // ── Handlers ───────────────────────────────────────────────────

  async function handleSubmit() {
    const trimmed = input.trim();
    if (!trimmed || submitting || isActive) return;

    setSubmitting(true);
    reset();
    try {
      const newRun = await createAgentRun({
        projectId,
        message: trimmed,
        currentPath: filePath ?? undefined,
        selectedText: selectedCode ?? undefined,
      });
      setRun(newRun);
      setInput("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    } catch (err) {
      console.error("[Agent] Failed to create run:", err);
      toast.error("Failed to start agent run. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel() {
    if (!run) return;
    try {
      await cancelAgentRun(run.id);
      toast.info("Agent run canceled.");
    } catch {
      toast.error("Failed to cancel run.");
    }
  }

  const handleDecide = useCallback(
    async (hunkId: string, decision: HunkDecision) => {
      if (!run) return;
      // Optimistic update
      updateHunkDecision(hunkId, decision);
      try {
        const updated = await decideHunk(run.id, hunkId, decision);
        setProposal(updated);
      } catch {
        toast.error("Failed to record decision. Please try again.");
        // Revert optimistic update on error
        updateHunkDecision(hunkId, "PENDING");
      }
    },
    [run, updateHunkDecision, setProposal]
  );

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  // ── Render ─────────────────────────────────────────────────────

  return (
    <div className="flex h-full flex-col bg-[#0d0d0f] border-l border-white/[0.08]">
      {/* ── Header ── */}
      <div className="flex h-10 shrink-0 items-center gap-2 border-b border-white/[0.08] px-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex h-5 w-5 items-center justify-center rounded-md bg-violet-500/20 text-violet-400">
            <Bot className="h-3 w-3" />
          </div>
          <span className="text-xs font-semibold text-foreground">Velo Agent</span>
          {runStatus && <StatusPill status={runStatus} />}
        </div>
        <div className="flex items-center gap-0.5">
          {isActive && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-red-400"
              title="Cancel run"
              onClick={handleCancel}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
          {run && !isActive && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              title="Start new run"
              onClick={reset}
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            title="Close agent panel"
            onClick={onClose}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* ── Mode toggle tabs (only if no active run) ── */}
      {!run && onSwitchToChat && (
        <div className="flex shrink-0 border-b border-white/[0.06]">
          <button
            onClick={onSwitchToChat}
            className={cn(
              "flex items-center gap-1.5 flex-1 py-2 text-[11px] justify-center transition-colors",
              "text-muted-foreground hover:text-foreground"
            )}
          >
            <MessageSquare className="h-3 w-3" />
            Chat
          </button>
          <button
            className={cn(
              "flex items-center gap-1.5 flex-1 py-2 text-[11px] justify-center border-b-2 transition-colors",
              "border-violet-500 text-violet-400"
            )}
          >
            <Terminal className="h-3 w-3" />
            Agent
          </button>
        </div>
      )}

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
        {/* No run yet → show intro */}
        {!run && (
          <div className="flex flex-col items-center gap-3 p-5 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15 border border-violet-500/20">
              <Sparkles className="h-5 w-5 text-violet-400" />
            </div>
            <p className="text-xs text-foreground font-medium">Agentic Code Editing</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Describe a change and Velo Agent will plan it, search your codebase, generate a
              structured diff, and wait for your review before touching any file.
            </p>
          </div>
        )}

        {/* Active run → show progress */}
        {run && !isWaitingReview && (
          <AgentProgressPanel
            steps={steps}
            warnings={warnings}
            sseConnected={sseConnected}
          />
        )}

        {/* Waiting for review → show diff viewer */}
        {run && isWaitingReview && proposal && (
          <div className="flex flex-col gap-0">
            {/* Proposal header */}
            <div className="px-3 pt-3 pb-2 border-b border-white/[0.06]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-amber-400">
                  Review Required
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {pendingHunks} pending · {proposal.acceptedHunkCount} accepted ·{" "}
                  {proposal.rejectedHunkCount} rejected
                </span>
              </div>
              {proposal.description && (
                <p className="mt-1 text-[11px] text-muted-foreground/80 leading-relaxed">
                  {proposal.description}
                </p>
              )}
            </div>
            <div className="p-3">
              <AgentDiffViewer
                files={proposal.files}
                onDecide={handleDecide}
                disabled={!isWaitingReview}
              />
            </div>
          </div>
        )}

        {/* Waiting for review but proposal not loaded yet */}
        {run && isWaitingReview && !proposal && (
          <div className="flex items-center justify-center gap-2 py-10 text-[11px] text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-violet-400" />
            Loading proposal…
          </div>
        )}

        {/* Done / Failed state */}
        {run && (runStatus === "DONE" || runStatus === "FAILED") && (
          <div className="px-3 pt-3">
            <AgentProgressPanel
              steps={steps}
              warnings={warnings}
              sseConnected={false}
            />
            {run.errorMessage && (
              <div className="mt-3 rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-[11px] text-red-400">
                <span className="font-semibold">Error: </span>
                {run.errorMessage}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Input footer ── */}
      {!isActive && (
        <div className="shrink-0 border-t border-white/[0.08] p-2.5">
          <div className="flex items-end gap-2 rounded-xl bg-white/[0.04] border border-white/[0.08] px-3 py-2 focus-within:border-violet-500/40 transition-colors">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Describe a code change… (Enter to run)"
              className="min-h-[36px] max-h-[120px] flex-1 resize-none border-0 bg-transparent p-0 text-xs text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:ring-offset-0 scrollbar-thin scrollbar-thumb-white/10"
              rows={1}
              disabled={submitting}
            />
            <Button
              size="icon"
              className={cn(
                "h-7 w-7 shrink-0 rounded-lg transition-colors",
                input.trim() && !submitting
                  ? "bg-violet-600 hover:bg-violet-700 text-white"
                  : "bg-white/[0.04] text-muted-foreground cursor-not-allowed"
              )}
              disabled={!input.trim() || submitting}
              onClick={handleSubmit}
              title="Run agent (Enter)"
            >
              {submitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
          <p className="mt-1.5 px-1 text-[10px] text-muted-foreground/40 text-center">
            Agent will wait for your approval before writing any files.
          </p>
        </div>
      )}
    </div>
  );
}
