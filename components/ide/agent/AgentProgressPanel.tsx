"use client";

import { CheckCircle2, Circle, Loader2, XCircle, AlertTriangle, SkipForward } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AgentStep, AgentStepStatus } from "@/types/agent";

interface AgentWarning {
  id: string;
  message: string;
}

interface AgentProgressPanelProps {
  steps: AgentStep[];
  warnings: AgentWarning[];
}

function StepIcon({ status }: { status: AgentStepStatus }) {
  switch (status) {
    case "DONE":
      return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />;
    case "RUNNING":
      return <Loader2 className="h-3.5 w-3.5 text-violet-400 shrink-0 animate-spin" />;
    case "FAILED":
      return <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />;
    case "SKIPPED":
      return <SkipForward className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />;
    default:
      return <Circle className="h-3.5 w-3.5 text-muted-foreground/25 shrink-0" />;
  }
}

function stepDuration(step: AgentStep): string | null {
  if (!step.startedAt || !step.completedAt) return null;
  const ms = new Date(step.completedAt).getTime() - new Date(step.startedAt).getTime();
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
}

export function AgentProgressPanel({ steps, warnings }: AgentProgressPanelProps) {
  return (
    <div className="flex flex-col gap-3 p-3">
      {steps.length === 0 ? (
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground py-2">
          <Loader2 className="h-3.5 w-3.5 text-violet-400 shrink-0 animate-spin" />
          <span>Starting up&hellip;</span>
        </div>
      ) : (
        <ol className="relative flex flex-col gap-0">
          {steps.map((step, i) => (
            <li key={step.id} className="flex gap-2.5">
              <div className="flex flex-col items-center">
                <StepIcon status={step.status} />
                {i < steps.length - 1 && (
                  <span className="w-px flex-1 bg-white/[0.06] mt-1 mb-1" />
                )}
              </div>
              <div className={cn("pb-2.5 flex-1 min-w-0", i === steps.length - 1 && "pb-0")}>
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "text-[11px] font-medium leading-none",
                      step.status === "RUNNING" && "text-violet-300",
                      step.status === "DONE" && "text-foreground",
                      step.status === "FAILED" && "text-red-400",
                      (step.status === "SKIPPED" || step.status === "PENDING") &&
                        "text-muted-foreground/50"
                    )}
                  >
                    {step.title}
                  </span>
                  {stepDuration(step) && (
                    <span className="text-[10px] text-muted-foreground/40 shrink-0">
                      {stepDuration(step)}
                    </span>
                  )}
                </div>
                {step.summary && (
                  <p className="mt-0.5 text-[10px] text-muted-foreground/60 truncate">
                    {step.summary}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}

      {warnings.length > 0 && (
        <div className="flex flex-col gap-1.5 border-t border-white/[0.06] pt-2.5">
          <span className="text-[10px] font-semibold text-amber-400 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> Warnings
          </span>
          {warnings.map((w) => (
            <p key={w.id} className="text-[10px] text-amber-300/80 leading-relaxed">
              {w.message}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
