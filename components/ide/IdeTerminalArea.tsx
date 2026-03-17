"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { Terminal, X, Minus, ChevronUp, Wifi, WifiOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTerminalWebSocket } from "@/hooks/useTerminalWebSocket";
import { useTerminalStore, TerminalConnectionStatus } from "@/store/terminalStore";

import "@xterm/xterm/css/xterm.css";
interface IdeTerminalAreaProps {
    /**
     * The project ID of the currently open project.
     * Forwarded to the WebSocket hook so it can build the correct endpoint URL.
     */
    projectId: string;
}

// Status indicator helpers

function StatusDot({ status }: { status: TerminalConnectionStatus }) {
    const classMap: Record<TerminalConnectionStatus, string> = {
        idle: "bg-muted-foreground/40",
        connecting: "bg-yellow-400 animate-pulse",
        connected: "bg-green-400",
        reconnecting: "bg-yellow-400 animate-pulse",
        disconnected: "bg-red-500",
    };

    const titleMap: Record<TerminalConnectionStatus, string> = {
        idle: "Terminal idle",
        connecting: "Connecting…",
        connected: "Connected to backend",
        reconnecting: "Reconnecting…",
        disconnected: "Disconnected",
    };

    return (
        <span
            className={cn("inline-block h-2 w-2 rounded-full shrink-0", classMap[status])}
            title={titleMap[status]}
        />
    );
}

function StatusLabel({ status }: { status: TerminalConnectionStatus }) {
    if (status === "connecting" || status === "reconnecting") {
        return (
            <span className="flex items-center gap-1 text-[10px] text-yellow-400/80">
                <Loader2 className="h-2.5 w-2.5 animate-spin" />
                {status === "connecting" ? "Connecting" : "Reconnecting"}
            </span>
        );
    }
    if (status === "connected") {
        return (
            <span className="flex items-center gap-1 text-[10px] text-green-400/80">
                <Wifi className="h-2.5 w-2.5" />
                Live
            </span>
        );
    }
    if (status === "disconnected") {
        return (
            <span className="flex items-center gap-1 text-[10px] text-red-400/80">
                <WifiOff className="h-2.5 w-2.5" />
                Offline
            </span>
        );
    }
    return null;
}

// Component

/**
 * IdeTerminalArea
 *
 * Pure UI component responsible for:
 *  - Mounting and configuring the xterm.js instance.
 *  - Delegating all WebSocket lifecycle to `useTerminalWebSocket`.
 *  - Showing a connection status badge in the tab bar.
 */
export function IdeTerminalArea({ projectId }: IdeTerminalAreaProps) {
    const [minimised, setMinimised] = useState(false);

    // xterm refs 
    const terminalRef = useRef<HTMLDivElement>(null);
    const [xtermInstance, setXtermInstance] = useState<XTerm | null>(null);
    const fitAddonRef = useRef<FitAddon | null>(null);
    // Stable ref to the live sendData function provided by the hook.
    const sendDataRef = useRef<((data: string) => void) | null>(null);

    // Global store
    const status = useTerminalStore((s) => s.status);
    const { setStatus } = useTerminalStore.getState();

    // xterm boot
    useEffect(() => {
        if (!terminalRef.current || minimised) return;

        const term = new XTerm({
            cursorBlink: true,
            fontSize: 13,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            theme: {
                background: "#0d0d0d",
                foreground: "#ffffff",
                cursor: "#4ade80",
                black: "#000000",
                red: "#ff5555",
                green: "#50fa7b",
                yellow: "#f1fa8c",
                blue: "#bd93f9",
                magenta: "#ff79c6",
                cyan: "#8be9fd",
                white: "#bfbfbf",
            },
            allowProposedApi: true,
        });

        const fitAddon = new FitAddon();
        const webLinksAddon = new WebLinksAddon();

        term.loadAddon(fitAddon);
        term.loadAddon(webLinksAddon);
        term.open(terminalRef.current);
        fitAddon.fit();

        setXtermInstance(term);
        fitAddonRef.current = fitAddon;

        const dataDisposable = term.onData((data) => {
            sendDataRef.current?.(data);
        });

        const handleResize = () => fitAddon.fit();
        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
            dataDisposable.dispose();
            term.dispose();
            setXtermInstance(null);
            fitAddonRef.current = null;
        };
    }, [minimised]);

    // WebSocket callbacks
    const handleConnected = useCallback((sendFn: (data: string) => void) => {
        sendDataRef.current = sendFn;
        setStatus("connected");
    }, [setStatus]);

    const handleDisconnected = useCallback(() => {
        sendDataRef.current = null;
        setStatus("disconnected");
    }, [setStatus]);

    // Activate WebSocket hook when xterm is ready
    useTerminalWebSocket({
        term: xtermInstance,
        projectId,
        onConnected: handleConnected,
        onDisconnected: handleDisconnected,
    });

    return (
        <div
            className={cn(
                "flex shrink-0 flex-col border-t border-border bg-[#0d0d0d] transition-all duration-200",
                minimised ? "h-8" : "h-64"
            )}
        >
            {/* Terminal tab / title bar */}
            <div className="flex h-8 shrink-0 items-center gap-2 border-b border-border/40 bg-card/40 px-3">
                {/* Tab pill */}
                <div className="flex items-center gap-1.5 rounded-t border border-b-transparent border-border bg-background px-3 py-1 text-xs font-medium text-foreground -mb-[1px]">
                    <Terminal className="h-3 w-3 text-green-400" />
                    bash
                </div>

                {/* Connection status badge */}
                <div className="flex items-center gap-1.5">
                    <StatusDot status={status} />
                    <StatusLabel status={status} />
                </div>

                <div className="flex-1" />

                {/* Controls */}
                <div className="flex items-center gap-0.5">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 text-muted-foreground/60 hover:text-foreground"
                        onClick={() => setMinimised((v) => !v)}
                        title={minimised ? "Expand terminal" : "Minimise terminal"}
                    >
                        {minimised ? (
                            <ChevronUp className="h-3 w-3" />
                        ) : (
                            <Minus className="h-3 w-3" />
                        )}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 text-muted-foreground/60 hover:text-destructive"
                        title="Close terminal (toggle from toolbar)"
                        disabled
                    >
                        <X className="h-3 w-3" />
                    </Button>
                </div>
            </div>

            {/* Terminal body */}
            <div
                ref={terminalRef}
                className={cn(
                    "flex-1 overflow-hidden",
                    minimised && "hidden"
                )}
            />
        </div>
    );
}
