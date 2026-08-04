/**
 * agentService.ts
 *
 * API layer for all Agent-mode endpoints:
 * - Run creation & retrieval
 * - Proposal fetching
 * - Per-hunk decisions
 *
 * SSE connection is NOT handled here — see useAgentSse hook.
 */

import api from "./api";
import type { AgentRun, Proposal, HunkDecision } from "@/types/agent";

const BASE = "/v1/ai/agent";

// ── Run Management ────────────────────────────────────────────────

export interface CreateRunRequest {
  projectId: string;
  message: string;
  currentPath?: string;
  selectedText?: string;
}

/**
 * Creates a new agent run for a project.
 * Returns the persisted run immediately; actual execution is async via SSE.
 */
export async function createAgentRun(req: CreateRunRequest): Promise<AgentRun> {
  const res = await api.post<AgentRun>(`${BASE}/runs`, req);
  return res.data;
}

/** Fetches the current status and steps for a run. */
export async function getAgentRun(runId: string): Promise<AgentRun> {
  const res = await api.get<AgentRun>(`${BASE}/runs/${runId}`);
  return res.data;
}

/** Cancels a running or queued agent run. */
export async function cancelAgentRun(runId: string): Promise<void> {
  await api.post(`${BASE}/runs/${runId}/cancel`);
}

// ── Proposal Management ───────────────────────────────────────────

/**
 * Fetches the full proposal for a run that is in WAITING_FOR_APPROVAL state.
 * Returns the proposal with all files and hunks.
 */
export async function getProposal(runId: string): Promise<Proposal> {
  const res = await api.get<Proposal>(`${BASE}/runs/${runId}/proposal`);
  return res.data;
}

/**
 * Records an accept or reject decision for a single hunk.
 * Returns the updated full proposal (refreshed counts).
 */
export async function decideHunk(
  runId: string,
  hunkId: string,
  decision: HunkDecision
): Promise<Proposal> {
  const res = await api.post<Proposal>(
    `${BASE}/runs/${runId}/proposal/hunks/${hunkId}/decide`,
    { decision }
  );
  return res.data;
}

// ── Apply ─────────────────────────────────────────────────────────

export type ApplyOutcome =
  | "SUCCESS"
  | "PARTIAL"
  | "NOTHING_TO_APPLY"
  | "PREFLIGHT_FAILED";

export type FileApplyStatus = "APPLIED" | "SKIPPED" | "CONFLICT" | "ERROR";

export interface ApplyFileResult {
  filePath: string;
  status: FileApplyStatus;
  message?: string;
}

export interface ApplyResult {
  proposalId: string;
  runId: string;
  outcome: ApplyOutcome;
  summary: string;
  fileResults: ApplyFileResult[];
  filesApplied: number;
  filesSkipped: number;
  filesFailed: number;
}

/**
 * Triggers the Safe-Apply pipeline on the backend.
 * All hunks must be decided before calling this.
 * Returns a structured per-file result summary.
 */
export async function applyProposal(runId: string): Promise<ApplyResult> {
  const res = await api.post<ApplyResult>(`${BASE}/runs/${runId}/apply`);
  return res.data;
}
