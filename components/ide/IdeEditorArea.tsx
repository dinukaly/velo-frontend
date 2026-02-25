import { Code2 } from "lucide-react";

/**
 * IdeEditorArea
 *
 * Placeholder for the Monaco Editor integration.
 * Occupies all remaining vertical space in the IDE workspace.
 */
export function IdeEditorArea() {
    return (
        <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-background">
            {/* Subtle dot-grid background pattern */}
            <div
                className="pointer-events-none absolute inset-0 opacity-[0.035]"
                style={{
                    backgroundImage:
                        "radial-gradient(circle, currentColor 1px, transparent 1px)",
                    backgroundSize: "24px 24px",
                }}
            />

            {/* Placeholder content */}
            <div className="relative flex flex-col items-center gap-4 text-center px-8">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-card text-muted-foreground/50">
                    <Code2 className="h-8 w-8" />
                </div>
                <div className="space-y-1.5">
                    <p className="text-sm font-medium text-muted-foreground">
                        Monaco Editor
                    </p>
                    <p className="text-xs text-muted-foreground/60">
                        Select a file from the explorer to begin editing.
                    </p>
                </div>

                {/* Mock tab bar hint */}
                <div className="absolute -top-[calc(50vh-5.5rem)] left-0 right-0 flex items-center gap-px border-b border-border bg-card/50 px-2 py-1 text-xs">
                    <div className="flex items-center gap-1.5 rounded-t border-t border-l border-r border-border bg-background px-3 py-1.5 text-muted-foreground">
                        <Code2 className="h-3 w-3" />
                        index.ts
                    </div>
                </div>
            </div>
        </div>
    );
}
