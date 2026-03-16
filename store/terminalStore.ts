"use client";

import { create } from "zustand";


export type TerminalConnectionStatus =
    | "idle"           // Hook not yet mounted / projectId not set
    | "connecting"     // WebSocket is being opened
    | "connected"      // WS open and healthy
    | "reconnecting"   // Connection dropped — scheduled for retry
    | "disconnected"   // Permanently closed / max retries exceeded
    | "mock";          // Running local mock shell (no backend)

interface TerminalState {
    /** Current WebSocket connection status for the active project. */
    status: TerminalConnectionStatus;
    /** How many reconnection attempts have been made in the current session. */
    reconnectAttempts: number;
    /** If true, the terminal panel is open in the IDE layout. */
    isOpen: boolean;

    // Actions 
    setStatus: (status: TerminalConnectionStatus) => void;
    setReconnectAttempts: (n: number) => void;
    setIsOpen: (open: boolean) => void;
}

// Store

export const useTerminalStore = create<TerminalState>()((set) => ({
    status: "idle",
    reconnectAttempts: 0,
    isOpen: false,

    setStatus: (status) => set({ status }),
    setReconnectAttempts: (n) => set({ reconnectAttempts: n }),
    setIsOpen: (open) => set({ isOpen: open }),
}));
