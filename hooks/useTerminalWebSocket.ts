import { useEffect, useRef, useCallback } from "react";
import { Terminal as XTerm } from "@xterm/xterm";
import { useAuthStore } from "@/store/authStore";
import { useTerminalStore } from "@/store/terminalStore";

// Constants

/** Maximum number of reconnection attempts before giving up. */
const MAX_RECONNECT_ATTEMPTS = 5;

/** Base delay (ms) for the first reconnect — doubles on each failure. */
const RECONNECT_BASE_DELAY_MS = 1_000;

/** How often to send a WebSocket ping to keep the connection alive (ms). */
const HEARTBEAT_INTERVAL_MS = 30_000;

/** Message the server echoes back to confirm a ping. */
const PONG_MESSAGE = "__pong__";

// Types

export interface UseTerminalWebSocketOptions {
    /** The xterm.js terminal instance to write output into. */
    term: XTerm | null;
    /** Project ID used to build the WebSocket URL. */
    projectId: string;
    /**
     * Called when the WS connection is established so the component can
     * disable mock mode and wire up `term.onData → ws.send`.
     */
    onConnected: (sendData: (data: string) => void) => void;
    /**
     * Called when the connection is permanently lost so the component can
     * fall back to or restore mock mode.
     */
    onDisconnected: () => void;
}

// Hook

/**
 * useTerminalWebSocket
 *
 * Manages the full WebSocket lifecycle for an IDE terminal panel.
 *
 * Features:
 *  - Connects to `ws(s)://<host>/api/projects/:id/terminal` automatically.
 *  - Exponential-backoff auto-reconnect (up to MAX_RECONNECT_ATTEMPTS).
 *  - Heartbeat ping every HEARTBEAT_INTERVAL_MS to detect silent disconnects.
 *  - Writes connection events (connect, reconnect, error, close) directly into
 *    the xterm instance as colour-coded status lines.
 *  - Exposes a stable `sendData` callback for the component to use.
 *  - Publishes connection status to `useTerminalStore` for global visibility.
 *  - Gracefully tears down all resources (WS, timers, listeners) on unmount.
 *
 * When the backend returns an error on the first connection attempt, the hook
 * signals `onDisconnected` so the component can activate its mock shell.
 */
export function useTerminalWebSocket({
    term,
    projectId,
    onConnected,
    onDisconnected,
}: UseTerminalWebSocketOptions) {
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const attemptsRef = useRef(0);
    const isUnmountedRef = useRef(false);

    const { setStatus, setReconnectAttempts } = useTerminalStore.getState();

    // Helpers 

    const clearReconnectTimer = () => {
        if (reconnectTimerRef.current !== null) {
            clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = null;
        }
    };

    const clearHeartbeat = () => {
        if (heartbeatTimerRef.current !== null) {
            clearInterval(heartbeatTimerRef.current);
            heartbeatTimerRef.current = null;
        }
    };

    const writeStatus = useCallback(
        (message: string, colour: "green" | "red" | "yellow" | "cyan" = "cyan") => {
            if (!term) return;
            const codes: Record<string, string> = {
                green: "\x1b[1;32m",
                red: "\x1b[1;31m",
                yellow: "\x1b[1;33m",
                cyan: "\x1b[1;36m",
            };
            term.writeln(`\r\n${codes[colour]}${message}\x1b[0m`);
        },
        [term]
    );

    // sendData (stable reference) 

    const sendData = useCallback((data: string) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(data);
        }
    }, []);

    // Heartbeat 

    const startHeartbeat = useCallback(() => {
        clearHeartbeat();
        heartbeatTimerRef.current = setInterval(() => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send("__ping__");
            }
        }, HEARTBEAT_INTERVAL_MS);
    }, []);

    // connect (stable reference) 

    const connect = useCallback(() => {
        if (isUnmountedRef.current) return;
        if (!projectId) return;

        // Build WebSocket URL — uses same host as the HTTP API, swapping scheme.
        const apiBase =
            process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";
        const wsBase = apiBase.replace(/^http/, "ws").replace(/\/api.*$/, "");
        const wsUrl = `${wsBase}/api/projects/${projectId}/terminal`;

        // Attach the JWT token as a query parameter (standard approach; cookies
        // are not available for WS connections from the browser).
        const token = useAuthStore.getState().token;
        const fullUrl = token ? `${wsUrl}?token=${encodeURIComponent(token)}` : wsUrl;

        setStatus("connecting");

        const ws = new WebSocket(fullUrl);
        wsRef.current = ws;

        // onopen (stable reference) 
        ws.onopen = () => {
            if (isUnmountedRef.current) {
                ws.close();
                return;
            }

            // Capture attempt count before resetting so we can distinguish
            // a first connection from a reconnection.
            const wasReconnect = attemptsRef.current > 0;
            attemptsRef.current = 0;
            setReconnectAttempts(0);
            setStatus("connected");

            writeStatus(
                wasReconnect
                    ? "Reconnected successfully"
                    : "Connected to backend terminal",
                "green"
            );

            startHeartbeat();
            onConnected(sendData);
        };

        // onmessage (stable reference) 
        ws.onmessage = (event: MessageEvent<string>) => {
            // Silently swallow heartbeat pong — don't write it to the terminal.
            if (event.data === PONG_MESSAGE) return;
            term?.write(event.data);
        };

        // onerror (stable reference) 
        ws.onerror = () => {
            // onerror is always followed by onclose — let onclose drive retry logic.
            // We only log on the first attempt to avoid duplicate error messages.
            if (attemptsRef.current === 0) {
                writeStatus(
                    "[WebSocket error — falling back to mock shell]",
                    "red"
                );
            }
        };

        // onclose 
        ws.onclose = (event) => {
            clearHeartbeat();

            if (isUnmountedRef.current) return;

            // Normal closure (code 1000) or explicit user-initiated close.
            if (event.code === 1000) {
                setStatus("disconnected");
                writeStatus("[Terminal session closed]", "yellow");
                onDisconnected();
                return;
            }

            // Abnormal closure — schedule a reconnect with exponential backoff.
            const attempt = attemptsRef.current;

            if (attempt >= MAX_RECONNECT_ATTEMPTS) {
                setStatus("disconnected");
                writeStatus(
                    `[Could not reconnect after ${MAX_RECONNECT_ATTEMPTS} attempts — switching to mock shell]`,
                    "red"
                );
                onDisconnected();
                return;
            }

            const delay = RECONNECT_BASE_DELAY_MS * Math.pow(2, attempt);
            attemptsRef.current = attempt + 1;
            setReconnectAttempts(attemptsRef.current);
            setStatus("reconnecting");

            writeStatus(
                `[Connection lost — reconnecting in ${delay / 1000}s… (attempt ${attemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})]`,
                "yellow"
            );

            reconnectTimerRef.current = setTimeout(connect, delay);
        };
    }, [
        projectId,
        term,
        sendData,
        startHeartbeat,
        writeStatus,
        onConnected,
        onDisconnected,
        setStatus,
        setReconnectAttempts,
    ]);

    // Mount / unmount

    useEffect(() => {
        if (!term || !projectId) return;

        isUnmountedRef.current = false;
        connect();

        return () => {
            isUnmountedRef.current = true;
            clearReconnectTimer();
            clearHeartbeat();

            if (wsRef.current) {
                // Code 1000 = normal closure so onclose won't try to reconnect.
                wsRef.current.close(1000, "Component unmounted");
                wsRef.current = null;
            }

            setStatus("idle");
        };
        // Only re-run when the xterm instance or projectId changes.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [term, projectId]);

    return { sendData };
}
