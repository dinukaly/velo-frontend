"use client";

import { useState } from "react";
import { Terminal, X, Minus, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MOCK_TERMINAL_LINES = [
    { type: "info", text: "Browser IDE terminal — ready." },
    { type: "prompt", text: "$ " },
];

/**
 * IdeTerminalArea
 *
 * Placeholder for the Xterm integration.
 * Fixed height panel at the bottom of the IDE workspace.
 */
export function IdeTerminalArea() {
    const [minimised, setMinimised] = useState(false);

    return (
        <div
            className={cn(
                "flex shrink-0 flex-col border-t border-border bg-[#0d0d0d] transition-all duration-200",
                minimised ? "h-8" : "h-52"
            )}
        >
            {/* Terminal tab/title bar */}
            <div className="flex h-8 shrink-0 items-center gap-2 border-b border-border/40 bg-card/40 px-3">
                {/* Active tab */}
                <div className="flex items-center gap-1.5 rounded-t border border-b-transparent border-border bg-background px-3 py-1 text-xs font-medium text-foreground -mb-[1px]">
                    <Terminal className="h-3 w-3 text-green-400" />
                    bash
                </div>

                {/* Spacer */}
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
            {!minimised && (
                <div className="flex-1 overflow-y-auto px-4 py-3 font-mono text-xs leading-relaxed">
                    {MOCK_TERMINAL_LINES.map((line, i) => (
                        <div
                            key={i}
                            className={cn(
                                line.type === "info" && "text-muted-foreground/50 italic",
                                line.type === "prompt" && "text-green-400"
                            )}
                        >
                            {line.text}
                            {/* Blinking cursor on the last prompt line */}
                            {line.type === "prompt" && i === MOCK_TERMINAL_LINES.length - 1 && (
                                <span className="ml-px inline-block h-3.5 w-1.5 animate-pulse bg-green-400 align-middle" />
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
