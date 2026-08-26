"use client";

/**
 * useAgentSse.ts
 *
 * Manages the SSE connection to /api/v1/ai/agent/runs/{runId}/events.
 *
 * Features:
 * - Auto-reconnect with exponential back-off (up to 30 s)
 * - Parses SSE events and dispatches them to the agentStore
 * - Fetches the full proposal from the API when proposal.created arrives
 * - Cleans up the EventSource on unmount or runId change
 */

import { useEffect, useRef } from "react";
import { useAgentStore } from "@/store/agentStore";
import { getProposal, getAgentRun } from "@/services/agentService";
import type { AgentRun, AgentStep, AgentRunStatus } from "@/types/agent";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api";
const SSE_BASE = `${API_URL.replace(/\/$/, "")}/v1/ai/agent/runs`;

const TERMINAL_STATUSES: AgentRunStatus[] = [
  "DONE",
  "FAILED",
  "CANCELED",
  "REJECTED",
  "CONFLICTED",
];

/** Maximum reconnect delay in ms */
const MAX_BACKOFF_MS = 30_000;

interface UseAgentSseOptions {
  runId: string | null;
  enabled?: boolean;
}

export function useAgentSse({ runId, enabled = true }: UseAgentSseOptions) {
  const {
    updateRunStatus,
    upsertStep,
    setProposal,
    addWarning,
    setSseConnected,
    runStatus,
    proposal,
  } = useAgentStore();

  const esRef = useRef<EventSource | null>(null);
  const backoffRef = useRef(1000);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Tracks the latest run status seen during SSE replay/live, to guard
  // against stale replayed events triggering proposal fetches after DONE.
  const latestStatusRef = useRef<AgentRunStatus | null>(null);

  // Initial sync: fetch current run state in case events were missed before hook mount
  useEffect(() => {
    if (!runId || !enabled) return;

    getAgentRun(runId)
      .then((runDetail) => {
        if (runDetail.status) {
          updateRunStatus(runDetail.status);
          latestStatusRef.current = runDetail.status;
        }
        if (runDetail.steps && runDetail.steps.length > 0) {
          runDetail.steps.forEach((st) => upsertStep(st));
        }
        if (runDetail.status === "WAITING_FOR_APPROVAL") {
          getProposal(runId)
            .then((p) => {
              if (p) setProposal(p);
            })
            .catch((err) => console.warn("[useAgentSse] Initial proposal fetch failed:", err));
        }
      })
      .catch((err) => console.warn("[useAgentSse] Initial run sync failed:", err));
  }, [runId, enabled, updateRunStatus, upsertStep, setProposal]);

  // Fallback: If the run is in WAITING_FOR_APPROVAL but proposal isn't loaded, fetch it directly
  useEffect(() => {
    if (!runId || !enabled) return;
    if (runStatus === "WAITING_FOR_APPROVAL" && !proposal) {
      getProposal(runId)
        .then((p) => {
          if (p) setProposal(p);
        })
        .catch((err) => console.warn("[useAgentSse] Fallback proposal fetch failed:", err));
    }
  }, [runId, enabled, runStatus, proposal, setProposal]);

  useEffect(() => {
    if (!runId || !enabled) return;

    // Don't open a new SSE connection if run is already terminal
    if (runStatus && TERMINAL_STATUSES.includes(runStatus)) return;

    // Reset the local status tracker for this connection
    latestStatusRef.current = null;

    function connect() {
      if (esRef.current) {
        esRef.current.close();
      }

      const url = `${SSE_BASE}/${runId}/events`;
      const es = new EventSource(url, { withCredentials: true });
      esRef.current = es;

      es.onopen = () => {
        setSseConnected(true);
        backoffRef.current = 1000; // reset back-off on successful connect
      };

      es.onerror = () => {
        setSseConnected(false);
        es.close();
        esRef.current = null;

        // Exponential back-off reconnect
        reconnectTimerRef.current = setTimeout(() => {
          backoffRef.current = Math.min(backoffRef.current * 2, MAX_BACKOFF_MS);
          connect();
        }, backoffRef.current);
      };

      // ── run.status ──────────────────────────────────────────────
      es.addEventListener("run.status", (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data) as { status: AgentRunStatus };
          updateRunStatus(data.status);
          latestStatusRef.current = data.status;

          // Only fetch proposal if run is currently awaiting approval —
          // not if this is a replayed event from a run that later went DONE.
          if (
            data.status === "WAITING_FOR_APPROVAL" &&
            !TERMINAL_STATUSES.includes(latestStatusRef.current)
          ) {
            getProposal(runId!)
              .then((p) => {
                if (p) setProposal(p);
              })
              .catch((err) => console.warn("[SSE] Failed to fetch proposal on status:", err));
          }

          // Close SSE when run reaches a terminal state
          if (TERMINAL_STATUSES.includes(data.status)) {
            setSseConnected(false);
            es.close();
            esRef.current = null;
          }
        } catch {
          console.warn("[SSE] Failed to parse run.status:", e.data);
        }
      });

      // ── step.created / step.updated ──────────────────────────────
      const handleStep = (e: MessageEvent) => {
        try {
          const step = JSON.parse(e.data) as AgentStep;
          upsertStep(step);
        } catch {
          console.warn("[SSE] Failed to parse step event:", e.data);
        }
      };
      es.addEventListener("step.created", handleStep);
      es.addEventListener("step.updated", handleStep);

      // ── proposal.created ─────────────────────────────────────────
      es.addEventListener("proposal.created", async () => {
        try {
          // Skip if a terminal status has already been seen during replay —
          // this means we're replaying history for an already-completed run.
          if (
            latestStatusRef.current &&
            TERMINAL_STATUSES.includes(latestStatusRef.current)
          ) {
            return;
          }
          updateRunStatus("WAITING_FOR_APPROVAL");
          latestStatusRef.current = "WAITING_FOR_APPROVAL";
          // Fetch the full proposal tree from the API
          const proposal = await getProposal(runId!);
          if (proposal) {
            setProposal(proposal);
          }
        } catch (err) {
          console.warn("[SSE] Failed to fetch proposal:", err);
        }
      });

      // ── warning ──────────────────────────────────────────────────
      es.addEventListener("warning", (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data) as { message: string };
          addWarning({ id: crypto.randomUUID(), message: data.message });
        } catch {
          console.warn("[SSE] Failed to parse warning:", e.data);
        }
      });

      // ── run.completed / run.failed ───────────────────────────────
      const handleTerminal = (status: AgentRunStatus) => () => {
        updateRunStatus(status);
        latestStatusRef.current = status;
        setSseConnected(false);
        es.close();
        esRef.current = null;
      };
      es.addEventListener("run.completed", handleTerminal("DONE"));
      es.addEventListener("run.failed", handleTerminal("FAILED"));
      es.addEventListener("run.conflicted", handleTerminal("CONFLICTED"));
    }

    connect();

    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      esRef.current?.close();
      esRef.current = null;
      setSseConnected(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId, enabled]);
}
