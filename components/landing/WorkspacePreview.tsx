"use client";

import { useEffect, useState } from "react";
import {
  Check,
  ChevronDown,
  Code2,
  FileCode2,
  Folder,
  GitBranch,
  PanelLeft,
  Play,
  Terminal,
  WandSparkles,
} from "lucide-react";

type CodeToken = { text: string; color?: string };

const codeLines: CodeToken[][] = [
  [{ text: "const", color: "lp-purple" }, { text: " tasks = [" }, { text: '"Build UI"', color: "lp-green" }, { text: ", " }, { text: '"Review diff"', color: "lp-green" }, { text: "];" }],
  [],
  [{ text: "export function", color: "lp-purple" }, { text: " " }, { text: "renderTasks", color: "lp-yellow" }, { text: "() {" }],
  [{ text: "  " }, { text: "const", color: "lp-purple" }, { text: " root = document." }, { text: "querySelector", color: "lp-yellow" }, { text: "(" }, { text: '"#app"', color: "lp-green" }, { text: ");" }],
  [{ text: "  " }, { text: "if", color: "lp-purple" }, { text: " (!root) " }, { text: "return", color: "lp-purple" }, { text: ";" }],
  [],
  [{ text: "  root.innerHTML = tasks" }],
  [{ text: "    ." }, { text: "map", color: "lp-yellow" }, { text: "((task) => " }, { text: "`<li>${task}</li>`", color: "lp-green" }, { text: ")" }],
  [{ text: "    ." }, { text: "join", color: "lp-yellow" }, { text: "(" }, { text: '""', color: "lp-green" }, { text: ");" }],
  [{ text: "}" }],
];

const lineLengths = codeLines.map((line) => line.reduce((length, token) => length + token.text.length, 0));
const lineStarts = lineLengths.map((_, index) => lineLengths.slice(0, index).reduce((total, length) => total + length + 1, 0));
const totalChars = lineLengths.reduce((total, length) => total + length + 1, 0);
const typingFrames = Math.ceil(totalChars / 2);
const terminalFrame = typingFrames + 12;
const reviewFrame = terminalFrame + 18;
const cycleFrames = reviewFrame + 110;

function renderLine(tokens: CodeToken[], visibleChars: number) {
  let remaining = visibleChars;
  return tokens.map((token, index) => {
    const visibleText = token.text.slice(0, Math.max(0, remaining));
    remaining -= token.text.length;
    return <span className={token.color} key={index}>{visibleText}</span>;
  });
}

export function WorkspacePreview() {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer: ReturnType<typeof setInterval> | undefined;

    const updateMotion = () => {
      if (timer) clearInterval(timer);
      if (motionPreference.matches) {
        setFrame(reviewFrame);
      } else {
        setFrame(0);
        timer = setInterval(() => setFrame((current) => (current + 1) % cycleFrames), 35);
      }
    };

    updateMotion();
    motionPreference.addEventListener("change", updateMotion);
    return () => {
      if (timer) clearInterval(timer);
      motionPreference.removeEventListener("change", updateMotion);
    };
  }, []);

  const visibleChars = Math.min(totalChars, frame * 2);
  const activeLine = lineStarts.findLastIndex((start) => start <= visibleChars);
  const terminalReady = frame >= terminalFrame;
  const reviewReady = frame >= reviewFrame;

  return (
    <div className="workspace-preview" aria-label="Animated illustration of the Velo browser IDE">
      <div className="workspace-preview-topbar">
        <div className="workspace-preview-brand"><span>V</span> velo</div>
        <div className="workspace-preview-project"><Code2 size={13} /> studio-site <ChevronDown size={12} /></div>
        <div className="workspace-preview-actions"><GitBranch size={13} /> main <span className="workspace-preview-run"><Play size={11} fill="currentColor" /> Run</span></div>
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
          <div className="workspace-preview-code" aria-hidden="true">
            {codeLines.map((line, index) => {
              const lineChars = Math.max(0, Math.min(lineLengths[index], visibleChars - lineStarts[index]));
              return (
                <div className="workspace-preview-code-line" key={index}>
                  <span className="workspace-preview-line-number">{index + 1}</span>
                  <code>{renderLine(line, lineChars)}{visibleChars < totalChars && activeLine === index && <span className="workspace-preview-caret" />}</code>
                </div>
              );
            })}
          </div>
          <div className="workspace-preview-terminal">
            <div className="workspace-preview-terminal-title"><Terminal size={12} /> TERMINAL <span>×</span></div>
            <div><span className="lp-orange">➜</span> studio-site <span className="lp-muted">npm run dev</span></div>
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
      <div className="workspace-preview-statusbar"><span><GitBranch size={11} /> main</span><span>TypeScript&nbsp; · &nbsp;UTF-8&nbsp; · &nbsp;Ln 4, Col 18</span></div>
    </div>
  );
}
