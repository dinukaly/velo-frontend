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
import { getProposal } from "@/services/agentService";
import type { AgentRun, AgentStep, AgentRunStatus } from "@/types/agent";

const SSE_BASE =
  (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api") +
  "/v1/ai/agent/runs";

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
  } = useAgentStore();

  const esRef = useRef<EventSource | null>(null);
  const backoffRef = useRef(1000);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!runId || !enabled) return;

    // Don't open a new SSE connection if run is already terminal
    if (runStatus && TERMINAL_STATUSES.includes(runStatus)) return;

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
          // Fetch the full proposal tree from the API
          const proposal = await getProposal(runId!);
          setProposal(proposal);
        } catch (err) {
          console.error("[SSE] Failed to fetch proposal:", err);
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
