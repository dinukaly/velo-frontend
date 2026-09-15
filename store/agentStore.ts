"use client";

/**
 * agentStore.ts
 *
 * Zustand store for all Agent-mode UI state.
 *
 * Manages:
 * - Active run identity and status
 * - Live steps for the progress timeline
 * - Proposal and per-hunk decisions
 * - Warning list
 * - SSE connection state
 */

import { create } from "zustand";
import type {
  AgentRun,
  AgentStep,
  AgentRunStatus,
  Proposal,
  ProposalHunk,
  HunkDecision,
} from "@/types/agent";

interface AgentWarning {
  id: string;
  message: string;
}

interface AgentState {
  // ── Active run ──────────────────────────────────────────────────
  run: AgentRun | null;
  /** Granular status separate from the full run object for fast UI updates. */
  runStatus: AgentRunStatus | null;

  // ── Steps (live progress timeline) ──────────────────────────────
  steps: AgentStep[];

  // ── Proposal ────────────────────────────────────────────────────
  proposal: Proposal | null;

  // ── Warnings ────────────────────────────────────────────────────
  warnings: AgentWarning[];

  // ── SSE connection state ─────────────────────────────────────────
  sseConnected: boolean;

  // ── Actions ─────────────────────────────────────────────────────

  /** Sets the current run and resets all derived state. */
  setRun: (run: AgentRun) => void;

  /** Updates run status from SSE events without replacing the whole run. */
  updateRunStatus: (status: AgentRunStatus) => void;

  /** Adds or updates a step by sequence number. */
  upsertStep: (step: AgentStep) => void;

  /** Replaces the entire proposal (from API fetch or SSE update). */
  setProposal: (proposal: Proposal) => void;

  /** Updates a single hunk's decision in the proposal (optimistic update). */
  updateHunkDecision: (hunkId: string, decision: HunkDecision) => void;

  /** Appends a warning to the warning list. */
  addWarning: (warning: AgentWarning) => void;

  /** Sets the SSE connection state. */
  setSseConnected: (connected: boolean) => void;

  /** Full reset — called when starting a new run or closing the panel. */
  reset: () => void;
}

const initialState = {
  run: null,
  runStatus: null,
  steps: [],
  proposal: null,
  warnings: [],
  sseConnected: false,
};

export const useAgentStore = create<AgentState>()((set) => ({
  ...initialState,

  setRun: (run) =>
    set({
      run,
      runStatus: run.status,
      steps: run.steps ?? [],
      proposal: null,
      warnings: [],
    }),

  updateRunStatus: (status) =>
    set((state) => ({
      runStatus: status,
      run: state.run ? { ...state.run, status } : null,
    })),

  upsertStep: (step) =>
    set((state) => {
      const existing = state.steps.findIndex((s) => s.id === step.id);
      if (existing >= 0) {
        const updated = [...state.steps];
        updated[existing] = step;
        return { steps: updated };
      }
      return { steps: [...state.steps, step].sort((a, b) => a.sequence - b.sequence) };
    }),

  setProposal: (proposal) => set({ proposal }),

  updateHunkDecision: (hunkId, decision) =>
    set((state) => {
      if (!state.proposal) return {};
      const updatedFiles = state.proposal.files.map((file) => ({
        ...file,
        hunks: file.hunks.map((h: ProposalHunk) =>
          h.id === hunkId ? { ...h, decision } : h
        ),
      }));
      return { proposal: { ...state.proposal, files: updatedFiles } };
    }),

  addWarning: (warning) =>
    set((state) => ({ warnings: [...state.warnings, warning] })),

  setSseConnected: (sseConnected) => set({ sseConnected }),

  reset: () => set(initialState),
}));
