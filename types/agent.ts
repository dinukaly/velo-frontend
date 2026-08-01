// Agent run lifecycle types matching backend entities

export type AgentRunStatus =
  | "QUEUED"
  | "RUNNING"
  | "WAITING_FOR_APPROVAL"
  | "APPLYING"
  | "VERIFYING"
  | "DONE"
  | "FAILED"
  | "CANCELED"
  | "REJECTED"
  | "CONFLICTED";

export type FileChangeType = "CREATE" | "MODIFY" | "DELETE" | "RENAME";

export type HunkDecision = "PENDING" | "ACCEPTED" | "REJECTED" | "SKIPPED";

export type ProposalStatus =
  | "PENDING_REVIEW"
  | "APPLYING"
  | "APPLIED"
  | "REJECTED"
  | "FAILED"
  | "EXPIRED";

// ── SSE Event types ────────────────────────────────────────────────

export type AgentSseEventType =
  | "run.status"
  | "step.created"
  | "step.updated"
  | "proposal.created"
  | "proposal.updated"
  | "hunk.updated"
  | "warning"
  | "verification.started"
  | "verification.output"
  | "verification.completed"
  | "run.completed"
  | "run.failed"
  | "run.conflicted";

export interface AgentSseEvent {
  type: AgentSseEventType;
  payload: string; // raw JSON string
}

// ── Step ──────────────────────────────────────────────────────────

export type AgentStepType =
  | "THINKING"
  | "TOOL_CALL"
  | "SEARCH"
  | "INDEX"
  | "PROPOSAL_GEN"
  | "APPLY"
  | "VERIFY";

export type AgentStepStatus = "PENDING" | "RUNNING" | "DONE" | "FAILED" | "SKIPPED";

export interface AgentStep {
  id: string;
  sequence: number;
  type: AgentStepType;
  status: AgentStepStatus;
  label: string;
  detail?: string;
  startedAt?: string;
  completedAt?: string;
}

// ── Run ───────────────────────────────────────────────────────────

export interface AgentRun {
  id: string;
  projectId: string;
  message: string;
  status: AgentRunStatus;
  summary?: string;
  warningsJson?: string;
  errorCode?: string;
  errorMessage?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  steps?: AgentStep[];
}

// ── Proposal ──────────────────────────────────────────────────────

export interface ProposalHunk {
  id: string;
  ordinal: number;
  originalStartLine: number;
  originalEndLine: number;
  originalContent: string;
  newContent: string;
  diffSnippet: string;
  changeGroupKey?: string;
  label?: string;
  decision: HunkDecision;
  decidedAt?: string;
}

export interface ProposalFile {
  id: string;
  filePath: string;
  newFilePath?: string;
  changeType: FileChangeType;
  rationale?: string;
  hunks: ProposalHunk[];
}

export interface Proposal {
  id: string;
  runId: string;
  status: ProposalStatus;
  description?: string;
  totalHunkCount: number;
  acceptedHunkCount: number;
  rejectedHunkCount: number;
  proposalSchemaVersion: number;
  createdAt: string;
  updatedAt: string;
  files: ProposalFile[];
}

// ── Agent mode ────────────────────────────────────────────────────

export type AgentPanelMode = "chat" | "agent";
