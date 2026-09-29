"use client";

import { memo, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Bot,
  Check,
  ChevronDown,
  Code2,
  FileCode2,
  Folder,
  GitBranch,
  PanelLeft,
  Play,
  Save,
  Settings,
  Sparkles,
  Terminal,
  WandSparkles,
} from "lucide-react";

type CodeToken = { text: string; color?: string };

const codeLines: CodeToken[][] = [
  [{ text: "const", color: "lp-purple" }, { text: " tasks = [" }, { text: '"Build UI"', color: "lp-string" }, { text: ", " }, { text: '"Review diff"', color: "lp-string" }, { text: "];" }],
  [],
  [{ text: "export function", color: "lp-purple" }, { text: " " }, { text: "renderTasks", color: "lp-yellow" }, { text: "() {" }],
  [{ text: "  " }, { text: "const", color: "lp-purple" }, { text: " root = document." }, { text: "querySelector", color: "lp-yellow" }, { text: "(" }, { text: '"#app"', color: "lp-string" }, { text: ");" }],
  [{ text: "  " }, { text: "if", color: "lp-purple" }, { text: " (!root) " }, { text: "return", color: "lp-purple" }, { text: ";" }],
  [],
  [{ text: "  root.innerHTML = tasks" }],
  [{ text: "    ." }, { text: "map", color: "lp-yellow" }, { text: "((task) => " }, { text: "`<li>${task}</li>`", color: "lp-string" }, { text: ")" }],
  [{ text: "    ." }, { text: "join", color: "lp-yellow" }, { text: "(" }, { text: '""', color: "lp-string" }, { text: ");" }],
  [{ text: "}" }],
];

const lineLengths = codeLines.map((line) => line.reduce((length, token) => length + token.text.length, 0));
const lineStarts = lineLengths.map((_, index) => lineLengths.slice(0, index).reduce((total, length) => total + length + 1, 0));
const totalChars = lineLengths.reduce((total, length) => total + length + 1, 0);
const typingFrames = Math.ceil(totalChars / 3);
const terminalFrame = typingFrames + 8;
const reviewFrame = terminalFrame + 13;
const cycleFrames = reviewFrame + 77;

function renderLine(tokens: CodeToken[], visibleChars: number) {
  let remaining = visibleChars;
  return tokens.map((token, index) => {
    const visibleText = token.text.slice(0, Math.max(0, remaining));
    remaining -= token.text.length;
    return <span className={token.color} key={index}>{visibleText}</span>;
  });
}

const CodeLine = memo(function CodeLine({ tokens, index, visibleChars, showCaret }: {
  tokens: CodeToken[];
  index: number;
  visibleChars: number;
  showCaret: boolean;
}) {
  return (
    <div className="workspace-preview-code-line">
      <span className="workspace-preview-line-number">{index + 1}</span>
      <code>{renderLine(tokens, visibleChars)}{showCaret && <span className="workspace-preview-caret" />}</code>
    </div>
  );
});

function AnimatedCode({ onTerminalReady, onReviewReady }: {
  onTerminalReady: (ready: boolean) => void;
  onReviewReady: (ready: boolean) => void;
}) {
  const [frame, setFrame] = useState(0);
  const codeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer: ReturnType<typeof setInterval> | undefined;
    let inView = false;

    const syncAnimation = () => {
      if (timer) clearInterval(timer);
      if (motionPreference.matches) {
        setFrame(reviewFrame);
      } else if (inView && !document.hidden) {
        timer = setInterval(() => setFrame((current) => (current + 1) % cycleFrames), 50);
      }
    };

    const updateMotion = () => {
      setFrame(motionPreference.matches ? reviewFrame : 0);
      syncAnimation();
    };

    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      syncAnimation();
    });
    if (codeRef.current) observer.observe(codeRef.current);

    if (motionPreference.matches) setFrame(reviewFrame);
    motionPreference.addEventListener("change", updateMotion);
    document.addEventListener("visibilitychange", syncAnimation);
    return () => {
      if (timer) clearInterval(timer);
      observer.disconnect();
      motionPreference.removeEventListener("change", updateMotion);
      document.removeEventListener("visibilitychange", syncAnimation);
    };
  }, []);

  useEffect(() => {
    if (frame === 0) {
      onTerminalReady(false);
      onReviewReady(false);
    } else if (frame === terminalFrame) {
      onTerminalReady(true);
    } else if (frame === reviewFrame) {
      onTerminalReady(true);
      onReviewReady(true);
    }
  }, [frame, onTerminalReady, onReviewReady]);

  const visibleChars = Math.min(totalChars, frame * 3);
  const activeLine = lineStarts.findLastIndex((start) => start <= visibleChars);

  return (
    <div className="workspace-preview-code" ref={codeRef} aria-hidden="true">
      {codeLines.map((line, index) => {
        const lineChars = Math.max(0, Math.min(lineLengths[index], visibleChars - lineStarts[index]));
        return <CodeLine tokens={line} index={index} visibleChars={lineChars} showCaret={visibleChars < totalChars && activeLine === index} key={index} />;
      })}
    </div>
  );
}

export function WorkspacePreview() {
  const [terminalReady, setTerminalReady] = useState(false);
  const [reviewReady, setReviewReady] = useState(false);

  return (
    <div className="workspace-preview" aria-label="Animated illustration of the Velo browser IDE">
      <div className="workspace-preview-topbar">
        <div className="workspace-preview-project">
          <ArrowLeft size={14} />
          <span className="workspace-preview-sidebar-toggle"><PanelLeft size={14} /></span>
          <Code2 size={13} />
          <strong>studio-site</strong>
          <span className="workspace-preview-language">TypeScript</span>
        </div>
        <div className="workspace-preview-actions">
          <Save size={13} /><Terminal size={13} />
          <span className="workspace-preview-ai-toggle"><Sparkles size={13} /></span>
          <Bot size={13} /><GitBranch size={13} /><Settings size={13} />
          <span className="workspace-preview-run"><Play size={11} fill="currentColor" /> Run</span>
        </div>
      </div>

      <div className="workspace-preview-body">
        <aside className="workspace-preview-sidebar">
          <div className="workspace-preview-sidebar-title"><PanelLeft size={12} /> EXPLORER</div>
          <div className="workspace-preview-folder"><ChevronDown size={12} /> <Folder size={13} /> studio-site</div>
          <div className="workspace-preview-file workspace-preview-file-indent"><ChevronDown size={11} /> <Folder size={12} /> src</div>
          <div className="workspace-preview-file workspace-preview-file-active"><FileCode2 size={13} /> app.ts</div>
          <div className="workspace-preview-file workspace-preview-file-indent"><FileCode2 size={13} /> styles.css</div>
          <div className="workspace-preview-file"><FileCode2 size={13} /> package.json</div>
        </aside>

        <div className="workspace-preview-center">
          <div className="workspace-preview-tabs"><span><FileCode2 size={13} /> app.ts <span className="workspace-preview-tab-dot" /></span><span>styles.css</span></div>
          <div className="workspace-preview-breadcrumb">studio-site <span>/</span> src <span>/</span> app.ts</div>
          <AnimatedCode onTerminalReady={setTerminalReady} onReviewReady={setReviewReady} />
          <div className="workspace-preview-terminal">
            <div className="workspace-preview-terminal-title"><Terminal size={12} /> TERMINAL <span>×</span></div>
            <div><span className="lp-terminal-prompt">➜</span> studio-site <span className="lp-muted">npm run dev</span></div>
            <div className={`workspace-preview-reveal ${terminalReady ? "is-visible" : ""}`}><span className="lp-green">✓</span> Ready at <span className="lp-muted">localhost:3000</span></div>
          </div>
        </div>

        <aside className="workspace-preview-agent">
          <div className="workspace-preview-agent-title"><WandSparkles size={14} /> Velo Agent <span>×</span></div>
          <div className="workspace-preview-agent-request">Update the navigation spacing</div>
          <div className={`workspace-preview-agent-status workspace-preview-reveal ${reviewReady ? "is-visible" : ""}`}><Check size={12} /> Proposal ready for review</div>
          <div className={`workspace-preview-agent-file workspace-preview-reveal ${reviewReady ? "is-visible" : ""}`}><FileCode2 size={13} /> src/app.ts <span>+12 −4</span></div>
          <div className={`workspace-preview-diff workspace-preview-reveal ${reviewReady ? "is-visible" : ""}`}><span>− gap: 12px;</span><span>+ gap: 20px;</span></div>
          <div className={`workspace-preview-agent-footer workspace-preview-reveal ${reviewReady ? "is-visible" : ""}`}>Review proposed changes <span>↗</span></div>
        </aside>
      </div>
    </div>
  );
}
