"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  GitBranch,
  Copy,
  Check,
  Terminal,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CodeToken {
  text: string;
  className: string;
}

interface CodeLine {
  indent: number;
  tokens: CodeToken[];
}

interface Snippet {
  id: string;
  filename: string;
  language: string;
  languageColor: string;
  lines: CodeLine[];
  output: string[];
}

const SNIPPETS: Snippet[] = [
  {
    id: "ts",
    filename: "greet.ts",
    language: "TypeScript",
    languageColor: "#3b82f6",
    lines: [
      {
        indent: 0,
        tokens: [
          { text: "import", className: "text-purple-400 font-semibold" },
          { text: " { createServer } ", className: "text-foreground" },
          { text: "from", className: "text-purple-400 font-semibold" },
          { text: ' "velo/runtime"', className: "text-emerald-300" },
          { text: ";", className: "text-muted-foreground" },
        ],
      },
      {
        indent: 0,
        tokens: [
          { text: "interface", className: "text-purple-400 font-semibold" },
          { text: " WorkspaceConfig ", className: "text-amber-300 font-medium" },
          { text: "{", className: "text-foreground" },
        ],
      },
      {
        indent: 1,
        tokens: [
          { text: "project", className: "text-blue-300" },
          { text: ": ", className: "text-muted-foreground" },
          { text: "string", className: "text-cyan-400" },
          { text: ";", className: "text-muted-foreground" },
        ],
      },
      {
        indent: 1,
        tokens: [
          { text: "sandbox", className: "text-blue-300" },
          { text: ": ", className: "text-muted-foreground" },
          { text: '"docker"', className: "text-emerald-300" },
          { text: " | ", className: "text-purple-400" },
          { text: '"wasm"', className: "text-emerald-300" },
          { text: ";", className: "text-muted-foreground" },
        ],
      },
      {
        indent: 1,
        tokens: [
          { text: "agentMode", className: "text-blue-300" },
          { text: ": ", className: "text-muted-foreground" },
          { text: "boolean", className: "text-cyan-400" },
          { text: ";", className: "text-muted-foreground" },
        ],
      },
      {
        indent: 0,
        tokens: [{ text: "}", className: "text-foreground" }],
      },
      {
        indent: 0,
        tokens: [],
      },
      {
        indent: 0,
        tokens: [
          { text: "export async function", className: "text-purple-400 font-semibold" },
          { text: " startIDE", className: "text-yellow-300 font-medium" },
          { text: "(", className: "text-foreground" },
          { text: "config", className: "text-blue-300" },
          { text: ": ", className: "text-muted-foreground" },
          { text: "WorkspaceConfig", className: "text-amber-300" },
          { text: ") {", className: "text-foreground" },
        ],
      },
      {
        indent: 1,
        tokens: [
          { text: "const", className: "text-purple-400 font-semibold" },
          { text: " ide = ", className: "text-foreground" },
          { text: "await", className: "text-purple-400 font-semibold" },
          { text: " createServer", className: "text-yellow-300" },
          { text: "(config);", className: "text-foreground" },
        ],
      },
      {
        indent: 1,
        tokens: [
          { text: "console", className: "text-blue-300" },
          { text: ".", className: "text-muted-foreground" },
          { text: "log", className: "text-yellow-300" },
          { text: "(", className: "text-foreground" },
          { text: '`✨ Velo ready at ${', className: "text-emerald-300" },
          { text: "ide.url", className: "text-blue-300" },
          { text: "}`", className: "text-emerald-300" },
          { text: ");", className: "text-foreground" },
        ],
      },
      {
        indent: 1,
        tokens: [
          { text: "return", className: "text-purple-400 font-semibold" },
          { text: " ide;", className: "text-foreground" },
        ],
      },
      {
        indent: 0,
        tokens: [{ text: "}", className: "text-foreground" }],
      },
    ],
    output: [
      "$ velo run greet.ts",
      "[Sandbox] Docker container started (42ms)",
      "[Velo] Monaco language service initialized",
      "✨ Velo ready at http://localhost:3000",
    ],
  },
  {
    id: "py",
    filename: "agent.py",
    language: "Python",
    languageColor: "#22c55e",
    lines: [
      {
        indent: 0,
        tokens: [
          { text: "from", className: "text-purple-400 font-semibold" },
          { text: " velo.ai ", className: "text-cyan-400" },
          { text: "import", className: "text-purple-400 font-semibold" },
          { text: " AgentEngine, CodebaseContext", className: "text-amber-300" },
        ],
      },
      {
        indent: 0,
        tokens: [],
      },
      {
        indent: 0,
        tokens: [
          { text: "async def", className: "text-purple-400 font-semibold" },
          { text: " optimize_codebase", className: "text-yellow-300 font-medium" },
          { text: "(", className: "text-foreground" },
          { text: "project_id", className: "text-blue-300" },
          { text: ": ", className: "text-muted-foreground" },
          { text: "str", className: "text-cyan-400" },
          { text: ") -> ", className: "text-muted-foreground" },
          { text: "None", className: "text-purple-400" },
          { text: ":", className: "text-foreground" },
        ],
      },
      {
        indent: 1,
        tokens: [
          { text: "context = ", className: "text-foreground" },
          { text: "await", className: "text-purple-400 font-semibold" },
          { text: " CodebaseContext.", className: "text-amber-300" },
          { text: "load", className: "text-yellow-300" },
          { text: "(project_id)", className: "text-foreground" },
        ],
      },
      {
        indent: 1,
        tokens: [
          { text: "agent = ", className: "text-foreground" },
          { text: "AgentEngine", className: "text-amber-300" },
          { text: "(model=", className: "text-foreground" },
          { text: '"gemini-flash"', className: "text-emerald-300" },
          { text: ", mode=", className: "text-foreground" },
          { text: '"safe_diff"', className: "text-emerald-300" },
          { text: ")", className: "text-foreground" },
        ],
      },
      {
        indent: 1,
        tokens: [],
      },
      {
        indent: 1,
        tokens: [
          { text: "proposal = ", className: "text-foreground" },
          { text: "await", className: "text-purple-400 font-semibold" },
          { text: " agent.", className: "text-foreground" },
          { text: "plan_and_diff", className: "text-yellow-300" },
          { text: "(", className: "text-foreground" },
        ],
      },
      {
        indent: 2,
        tokens: [
          { text: "context=context,", className: "text-foreground" },
        ],
      },
      {
        indent: 2,
        tokens: [
          { text: "prompt=", className: "text-foreground" },
          { text: '"Add real-time SSE streaming and hybrid code search"', className: "text-emerald-300" },
        ],
      },
      {
        indent: 1,
        tokens: [{ text: ")", className: "text-foreground" }],
      },
      {
        indent: 1,
        tokens: [
          { text: "print", className: "text-yellow-300" },
          { text: "(", className: "text-foreground" },
          { text: 'f"✅ Generated {len(proposal.hunks)} hunks for review"', className: "text-emerald-300" },
          { text: ")", className: "text-foreground" },
        ],
      },
    ],
    output: [
      "$ python agent.py",
      "[RAG] Hybrid BM25 + dense vector indexed (156 files)",
      "[Agent] Planning edits across 4 files...",
      "✅ Generated 6 hunks for review (0 conflicts)",
    ],
  },
  {
    id: "rs",
    filename: "worker.rs",
    language: "Rust",
    languageColor: "#f97316",
    lines: [
      {
        indent: 0,
        tokens: [
          { text: "use", className: "text-purple-400 font-semibold" },
          { text: " velo_core::prelude::", className: "text-cyan-400" },
          { text: "*;", className: "text-foreground" },
        ],
      },
      {
        indent: 0,
        tokens: [],
      },
      {
        indent: 0,
        tokens: [
          { text: "#[tokio::main]", className: "text-amber-300 font-semibold" },
        ],
      },
      {
        indent: 0,
        tokens: [
          { text: "async fn", className: "text-purple-400 font-semibold" },
          { text: " main", className: "text-yellow-300 font-medium" },
          { text: "() -> ", className: "text-foreground" },
          { text: "Result", className: "text-amber-300" },
          { text: "<(), ", className: "text-foreground" },
          { text: "VeloError", className: "text-amber-300" },
          { text: "> {", className: "text-foreground" },
        ],
      },
      {
        indent: 1,
        tokens: [
          { text: "let", className: "text-purple-400 font-semibold" },
          { text: " runtime = ", className: "text-foreground" },
          { text: "VeloRuntime::", className: "text-amber-300" },
          { text: "builder", className: "text-yellow-300" },
          { text: "()", className: "text-foreground" },
        ],
      },
      {
        indent: 2,
        tokens: [
          { text: ".with_terminal(", className: "text-foreground" },
          { text: "true", className: "text-cyan-400" },
          { text: ")", className: "text-foreground" },
        ],
      },
      {
        indent: 2,
        tokens: [
          { text: ".with_git_integration()", className: "text-yellow-300" },
        ],
      },
      {
        indent: 2,
        tokens: [
          { text: ".spawn().", className: "text-yellow-300" },
          { text: "await", className: "text-purple-400 font-semibold" },
          { text: "?;", className: "text-foreground" },
        ],
      },
      {
        indent: 1,
        tokens: [],
      },
      {
        indent: 1,
        tokens: [
          { text: "println!", className: "text-yellow-300 font-semibold" },
          { text: '("⚡ Native container bridge ready in {}ms", runtime.startup_ms());', className: "text-emerald-300" },
        ],
      },
      {
        indent: 1,
        tokens: [
          { text: "Ok", className: "text-amber-300" },
          { text: "(())", className: "text-foreground" },
        ],
      },
      {
        indent: 0,
        tokens: [{ text: "}", className: "text-foreground" }],
      },
    ],
    output: [
      "$ cargo run --release",
      "   Compiling velo-worker v0.1.0",
      "    Finished release [optimized] target(s) in 0.84s",
      "⚡ Native container bridge ready in 8ms",
    ],
  },
];

export function AnimatedCodePreview() {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [visibleLineCount, setVisibleLineCount] = useState<number>(0);
  const [currentLineCharCount, setCurrentLineCharCount] = useState<number>(0);
  const [showTerminal, setShowTerminal] = useState<boolean>(false);
  const [terminalStep, setTerminalStep] = useState<number>(0);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  const snippet = SNIPPETS[activeTab];
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const restartTyping = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisibleLineCount(0);
    setCurrentLineCharCount(0);
    setShowTerminal(false);
    setTerminalStep(0);
  }, []);

  const handleTabChange = (index: number) => {
    setActiveTab(index);
    restartTyping();
  };

  useEffect(() => {
    if (isPaused) return;

    const currentLines = snippet.lines;
    const totalLines = currentLines.length;

    // Phase 1: Typing lines
    if (visibleLineCount < totalLines) {
      const activeLine = currentLines[visibleLineCount];
      const fullLineLength = activeLine.tokens.reduce(
        (acc, token) => acc + token.text.length,
        0
      );

      // Blank line fast-forward
      if (fullLineLength === 0) {
        timerRef.current = setTimeout(() => {
          setVisibleLineCount((prev) => prev + 1);
          setCurrentLineCharCount(0);
        }, 60);
        return () => {
          if (timerRef.current) clearTimeout(timerRef.current);
        };
      }

      if (currentLineCharCount < fullLineLength) {
        const charStep = 2;
        const speed = Math.random() * 15 + 18;
        timerRef.current = setTimeout(() => {
          setCurrentLineCharCount((prev) => Math.min(prev + charStep, fullLineLength));
        }, speed);
        return () => {
          if (timerRef.current) clearTimeout(timerRef.current);
        };
      } else {
        // Line finished, move to next line after short pause
        timerRef.current = setTimeout(() => {
          setVisibleLineCount((prev) => prev + 1);
          setCurrentLineCharCount(0);
        }, 55);
        return () => {
          if (timerRef.current) clearTimeout(timerRef.current);
        };
      }
    }

    // Phase 2: All lines typed -> Trigger terminal execution
    if (visibleLineCount >= totalLines && !showTerminal) {
      timerRef.current = setTimeout(() => {
        setShowTerminal(true);
        setTerminalStep(1);
      }, 400);
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }

    // Phase 3: Animate terminal output lines
    if (showTerminal && terminalStep < snippet.output.length) {
      timerRef.current = setTimeout(() => {
        setTerminalStep((prev) => prev + 1);
      }, 320);
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }

    // Phase 4: Wait and cycle to next snippet
    if (showTerminal && terminalStep >= snippet.output.length) {
      timerRef.current = setTimeout(() => {
        setActiveTab((prev) => (prev + 1) % SNIPPETS.length);
        restartTyping();
      }, 4500);
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }
  }, [
    visibleLineCount,
    currentLineCharCount,
    showTerminal,
    terminalStep,
    isPaused,
    snippet,
    restartTyping,
  ]);

  function handleCopy() {
    const fullText = snippet.lines
      .map((line) => {
        const indentStr = "  ".repeat(line.indent);
        const lineStr = line.tokens.map((t) => t.text).join("");
        return indentStr + lineStr;
      })
      .join("\n");

    navigator.clipboard.writeText(fullText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }

  const activeLineIndex = Math.min(visibleLineCount, snippet.lines.length - 1);
  const activeLineObj = snippet.lines[activeLineIndex];
  const activeLineLength = activeLineObj
    ? activeLineObj.tokens.reduce((acc, t) => acc + t.text.length, 0)
    : 0;

  return (
    <div
      className="relative w-full max-w-3xl rounded-xl border border-border/70 bg-[#0d0d11]/90 backdrop-blur-xl overflow-hidden shadow-2xl shadow-violet-950/20 group/editor transition-all duration-300"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Glow accent behind the window */}
      <div
        className="pointer-events-none absolute -inset-0.5 rounded-xl opacity-30 blur-xl transition-opacity group-hover/editor:opacity-50"
        style={{
          background: `radial-gradient(ellipse at 50% 0%, ${snippet.languageColor}33, transparent 70%)`,
        }}
      />

      {/* Window Chrome & Tab Bar */}
      <div className="relative flex items-center justify-between px-3.5 py-2.5 border-b border-white/[0.08] bg-black/40">
        {/* Window controls */}
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-rose-500/80 hover:brightness-110 transition-all cursor-pointer" />
          <span className="w-3 h-3 rounded-full bg-amber-500/80 hover:brightness-110 transition-all cursor-pointer" />
          <span className="w-3 h-3 rounded-full bg-emerald-500/80 hover:brightness-110 transition-all cursor-pointer" />
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none max-w-[65%]">
          {SNIPPETS.map((s, idx) => {
            const isActive = idx === activeTab;
            return (
              <button
                key={s.id}
                onClick={() => handleTabChange(idx)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono transition-all cursor-pointer",
                  isActive
                    ? "bg-white/[0.08] text-foreground border border-white/[0.12] shadow-xs"
                    : "text-muted-foreground/60 hover:text-muted-foreground hover:bg-white/[0.03]"
                )}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: s.languageColor }}
                />
                <span className="truncate">{s.filename}</span>
              </button>
            );
          })}
        </div>

        {/* Window Actions */}
        <div className="flex items-center gap-2 text-muted-foreground/50">
          <button
            onClick={restartTyping}
            className="p-1 rounded hover:text-foreground hover:bg-white/[0.06] transition-colors cursor-pointer"
            title="Replay animation"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleCopy}
            className="p-1 rounded hover:text-foreground hover:bg-white/[0.06] transition-colors cursor-pointer"
            title="Copy snippet"
          >
            {isCopied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
          <div className="hidden sm:flex items-center gap-1 pl-1 border-l border-white/[0.08] text-xs font-mono">
            <GitBranch className="w-3 h-3 text-muted-foreground/40" />
            <span className="text-[11px] text-muted-foreground/40">main</span>
          </div>
        </div>
      </div>

      {/* Editor Canvas */}
      <div className="relative flex min-h-[310px] text-xs sm:text-sm font-mono leading-relaxed bg-[#0b0b0f]/80">
        {/* Line Numbers */}
        <div className="flex flex-col items-end py-4 px-3 select-none border-r border-white/[0.06] bg-black/20 text-muted-foreground/25 min-w-[3rem]">
          {snippet.lines.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-6 leading-6 transition-colors",
                i === activeLineIndex && visibleLineCount < snippet.lines.length
                  ? "text-primary/70 font-semibold"
                  : ""
              )}
            >
              {i + 1}
            </span>
          ))}
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-x-auto py-4 pl-4 pr-6 scrollbar-thin scrollbar-thumb-white/10">
          {snippet.lines.map((line, lineIdx) => {
            const isFullyRendered = lineIdx < visibleLineCount;
            const isCurrentlyTyping = lineIdx === visibleLineCount;

            if (!isFullyRendered && !isCurrentlyTyping) {
              return <div key={lineIdx} className="h-6 leading-6" />;
            }

            let renderedCharsSoFar = 0;

            return (
              <div
                key={lineIdx}
                className={cn(
                  "relative flex items-center h-6 leading-6 whitespace-nowrap rounded px-1 -mx-1 transition-colors",
                  isCurrentlyTyping && "bg-white/[0.03]"
                )}
                style={{ paddingLeft: `${line.indent * 1.25}rem` }}
              >
                {line.tokens.map((token, tokenIdx) => {
                  if (isFullyRendered) {
                    return (
                      <span key={tokenIdx} className={token.className}>
                        {token.text}
                      </span>
                    );
                  }

                  const tokenStart = renderedCharsSoFar;
                  renderedCharsSoFar += token.text.length;

                  if (currentLineCharCount <= tokenStart) {
                    return null;
                  }

                  const visibleLength = currentLineCharCount - tokenStart;
                  const visibleSubstr = token.text.slice(0, visibleLength);

                  return (
                    <span key={tokenIdx} className={token.className}>
                      {visibleSubstr}
                    </span>
                  );
                })}

                {/* Blinking Cursor on active typing line */}
                {isCurrentlyTyping && (
                  <span className="inline-block w-2 h-4 bg-primary align-middle ml-0.5 animate-pulse shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Terminal Output Drawer */}
      {showTerminal && (
        <div className="border-t border-white/[0.08] bg-[#070709] px-4 py-3 text-xs font-mono">
          <div className="flex items-center gap-2 mb-2 text-muted-foreground/60">
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold text-[11px] text-muted-foreground/80">
              Terminal Output
            </span>
            <span className="text-[10px] text-muted-foreground/40 font-normal">
              (isolated sandbox container)
            </span>
          </div>

          <div className="flex flex-col gap-1 pl-1">
            {snippet.output.slice(0, terminalStep).map((outLine, idx) => (
              <div
                key={idx}
                className={cn(
                  "leading-5",
                  outLine.startsWith("$")
                    ? "text-blue-400 font-semibold"
                    : outLine.startsWith("✨") || outLine.startsWith("✅") || outLine.startsWith("⚡")
                    ? "text-emerald-300 font-medium"
                    : "text-muted-foreground/80"
                )}
              >
                {outLine}
              </div>
            ))}
            {terminalStep < snippet.output.length && (
              <span className="inline-block w-1.5 h-3.5 bg-emerald-400 animate-pulse mt-0.5" />
            )}
          </div>
        </div>
      )}

      {/* Status Bar */}
      <div className="flex items-center justify-between px-3.5 py-1.5 border-t border-white/[0.08] bg-black/40 text-[11px] text-muted-foreground/60 font-mono">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: snippet.languageColor }}
            />
            {snippet.language}
          </span>
          <span className="hidden sm:inline text-muted-foreground/40">UTF-8</span>
          <span className="hidden sm:inline text-muted-foreground/40">
            {isPaused ? "⏸ Hover to pause" : "▶ Auto-typing"}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span>
            Ln {activeLineIndex + 1}, Col {visibleLineCount < snippet.lines.length ? currentLineCharCount + 1 : activeLineLength + 1}
          </span>
          <span className="hidden sm:inline">2 spaces</span>
        </div>
      </div>
    </div>
  );
}
