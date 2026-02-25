"use client";

import { useEffect, useRef, useState } from "react";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { Terminal, X, Minus, ChevronUp, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import "@xterm/xterm/css/xterm.css";

/**
 * IdeTerminalArea
 *
 * Integrated xterm.js terminal.
 * Mocks a basic shell since the backend is not yet connected.
 */
export function IdeTerminalArea() {
    const [minimised, setMinimised] = useState(false);
    const terminalRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<XTerm | null>(null);
    const fitAddonRef = useRef<FitAddon | null>(null);

    // Shell state
    const currentLine = useRef("");

    useEffect(() => {
        if (!terminalRef.current || minimised) return;

        // Initialize xterm
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

        xtermRef.current = term;
        fitAddonRef.current = fitAddon;

        // Welcome message
        term.writeln("\x1b[1;32mBrowser IDE Terminal\x1b[0m");
        term.writeln("Type \x1b[1;33mhelp\x1b[0m to see available commands.");
        term.writeln("");
        term.write("\x1b[1;34m$ \x1b[0m");

        // Handle input
        term.onData((data) => {
            const code = data.charCodeAt(0);

            if (code === 13) { // Enter
                const cmd = currentLine.current.trim();
                term.writeln("");
                handleCommand(cmd, term);
                currentLine.current = "";
                term.write("\x1b[1;34m$ \x1b[0m");
            } else if (code === 127) { // Backspace
                if (currentLine.current.length > 0) {
                    currentLine.current = currentLine.current.slice(0, -1);
                    term.write("\b \b");
                }
            } else if (code < 32) {
                // Control characters
            } else {
                currentLine.current += data;
                term.write(data);
            }
        });

        // Handle resize
        const handleResize = () => {
            fitAddon.fit();
        };
        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
            term.dispose();
        };
    }, [minimised]);

    function handleCommand(cmd: string, term: XTerm) {
        if (!cmd) return;

        const parts = cmd.split(" ");
        const mainCmd = parts[0].toLowerCase();

        switch (mainCmd) {
            case "help":
                term.writeln("Available commands:");
                term.writeln("  help    - Show this message");
                term.writeln("  ls      - List files (mock)");
                term.writeln("  clear   - Clear terminal");
                term.writeln("  whoami  - Show current user");
                term.writeln("  date    - Show current date");
                term.writeln("  echo    - Print text");
                break;
            case "ls":
                term.writeln("src/  tests/  package.json  tsconfig.json  README.md");
                break;
            case "clear":
                term.clear();
                break;
            case "whoami":
                term.writeln("developer");
                break;
            case "date":
                term.writeln(new Date().toString());
                break;
            case "echo":
                term.writeln(parts.slice(1).join(" "));
                break;
            default:
                term.writeln(`command not found: ${mainCmd}`);
        }
    }

    return (
        <div
            className={cn(
                "flex shrink-0 flex-col border-t border-border bg-[#0d0d0d] transition-all duration-200",
                minimised ? "h-8" : "h-64" // Increased height slightly for better view
            )}
        >
            {/* Terminal tab/title bar */}
            <div className="flex h-8 shrink-0 items-center gap-2 border-b border-border/40 bg-card/40 px-3">
                <div className="flex items-center gap-1.5 rounded-t border border-b-transparent border-border bg-background px-3 py-1 text-xs font-medium text-foreground -mb-[1px]">
                    <Terminal className="h-3 w-3 text-green-400" />
                    bash
                </div>

                <div className="flex-1" />

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
