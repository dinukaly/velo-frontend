"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import {
  Terminal,
  FolderOpen,
  Code2,
  Zap,
  Globe,
  ArrowRight,
  ChevronRight,
  GitBranch,
  Layers,
  Shield,
} from "lucide-react";

const FEATURES = [
  {
    icon: <Code2 className="w-5 h-5" />,
    title: "Monaco Editor",
    desc: "Full VS Code-grade editor with IntelliSense, syntax highlighting, and multi-language support.",
    color: "from-blue-500/20 to-blue-600/5",
    border: "border-blue-500/20",
    iconBg: "bg-blue-500/10 text-blue-400",
  },
  {
    icon: <Terminal className="w-5 h-5" />,
    title: "Integrated Terminal",
    desc: "Real interactive shell powered by xterm.js, running inside a containerised sandbox environment.",
    color: "from-emerald-500/20 to-emerald-600/5",
    border: "border-emerald-500/20",
    iconBg: "bg-emerald-500/10 text-emerald-400",
  },
  {
    icon: <FolderOpen className="w-5 h-5" />,
    title: "File Explorer",
    desc: "Hierarchical file tree with inline create, rename, and delete — no context menu required.",
    color: "from-amber-500/20 to-amber-600/5",
    border: "border-amber-500/20",
    iconBg: "bg-amber-500/10 text-amber-400",
  },
  {
    icon: <Layers className="w-5 h-5" />,
    title: "Project Management",
    desc: "Create and manage multiple isolated projects, each backed by a dedicated Docker container.",
    color: "from-violet-500/20 to-violet-600/5",
    border: "border-violet-500/20",
    iconBg: "bg-violet-500/10 text-violet-400",
  },
  {
    icon: <Globe className="w-5 h-5" />,
    title: "Runs Anywhere",
    desc: "Zero setup — open your browser and start coding immediately. No local installs needed.",
    color: "from-cyan-500/20 to-cyan-600/5",
    border: "border-cyan-500/20",
    iconBg: "bg-cyan-500/10 text-cyan-400",
  },
  {
    icon: <Shield className="w-5 h-5" />,
    title: "Secure Sandbox",
    desc: "Every project runs in an isolated container. Your environment can't affect anyone else's.",
    color: "from-rose-500/20 to-rose-600/5",
    border: "border-rose-500/20",
    iconBg: "bg-rose-500/10 text-rose-400",
  },
];

const LANGUAGES = [
  { name: "TypeScript", color: "#3b82f6" },
  { name: "Python", color: "#22c55e" },
  { name: "Rust", color: "#f97316" },
  { name: "Go", color: "#06b6d4" },
  { name: "Java", color: "#ef4444" },
  { name: "C++", color: "#8b5cf6" },
  { name: "Node.js", color: "#84cc16" },
  { name: "Kotlin", color: "#a855f7" },
];

// Animated code lines in the hero preview
const CODE_PREVIEW = [
  { indent: 0, color: "text-purple-400", text: "function" , rest: " greet(name: string) {" },
  { indent: 1, color: "text-blue-400",   text: "const",    rest: ' msg = `Hello, ${name}!`;' },
  { indent: 1, color: "text-emerald-400",text: "console",  rest: ".log(msg);" },
  { indent: 1, color: "text-amber-400",  text: "return",   rest: " msg;" },
  { indent: 0, color: "text-slate-400",  text: "}",        rest: "" },
  { indent: 0, color: "text-slate-500",  text: "",         rest: "" },
  { indent: 0, color: "text-cyan-400",   text: "greet",    rest: '("Velo");' },
];

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const hasHydrated = useRef(false);

  useEffect(() => {
    // Only redirect once Zustand has rehydrated
    const check = () => {
      if (useAuthStore.persist.hasHydrated()) {
        hasHydrated.current = true;
        if (useAuthStore.getState().isAuthenticated) {
          router.replace("/dashboard");
        }
      }
    };
    check();
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      hasHydrated.current = true;
      if (useAuthStore.getState().isAuthenticated) {
        router.replace("/dashboard");
      }
    });
    return () => unsub();
  }, [router]);

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      {/* ── Background grid + glow ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 80% 50% at 50% -10%, oklch(0.4 0.15 264 / 0.18) 0%, transparent 70%),
            linear-gradient(to bottom, transparent 60%, oklch(0.145 0 0) 100%),
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 39px,
              oklch(1 0 0 / 0.03) 39px,
              oklch(1 0 0 / 0.03) 40px
            ),
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 39px,
              oklch(1 0 0 / 0.03) 39px,
              oklch(1 0 0 / 0.03) 40px
            )
          `,
        }}
      />

      {/* ── Top Nav ── */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 border-b border-border/50 bg-background/70 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 border border-primary/20">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary"
            >
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
          </div>
          <span className="font-bold tracking-tight text-foreground">Velo</span>
          <span className="hidden sm:inline-flex items-center gap-1 text-xs text-muted-foreground/60 font-mono bg-muted/50 px-2 py-0.5 rounded-full border border-border/50">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            v1.0
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-muted/50"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="text-sm font-medium px-4 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="flex flex-col items-center text-center px-6 pt-24 pb-16 gap-8">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 text-xs font-medium bg-primary/5 border border-primary/20 text-primary px-4 py-1.5 rounded-full">
          <Zap className="w-3.5 h-3.5" />
          Browser-based IDE · No installation required
        </div>

        {/* Headline */}
        <div className="flex flex-col gap-4 max-w-3xl">
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-[1.1]">
            Your IDE,{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, oklch(0.75 0.18 264), oklch(0.65 0.22 300))",
              }}
            >
              everywhere.
            </span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Velo is a full-featured, browser-based development environment.
            Write, run, and manage code projects from any device — no setup, no
            downloads.
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Link
            href="/register"
            id="cta-create-account"
            className="group inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/25 hover:scale-[1.02] active:scale-[0.98]"
          >
            Create a free account
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link
            href="/login"
            id="cta-sign-in"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm border border-border hover:bg-muted/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Sign in to your workspace
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </Link>
        </div>

        {/* Social proof */}
        <p className="text-xs text-muted-foreground/60">
          Free to use · Isolated sandbox per project · Real terminal access
        </p>
      </section>

      {/* ── Code Preview Window ── */}
      <section className="flex justify-center px-6 pb-20">
        <div className="w-full max-w-3xl rounded-xl border border-border/60 bg-card/50 backdrop-blur overflow-hidden shadow-2xl shadow-black/30">
          {/* Window chrome */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-muted/30">
            <span className="w-3 h-3 rounded-full bg-rose-500/70" />
            <span className="w-3 h-3 rounded-full bg-amber-500/70" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/70" />
            <div className="flex-1 flex justify-center">
              <span className="text-xs text-muted-foreground font-mono bg-background/50 px-3 py-0.5 rounded border border-border/40">
                greet.ts — Velo IDE
              </span>
            </div>
            <GitBranch className="w-3.5 h-3.5 text-muted-foreground/40" />
            <span className="text-xs text-muted-foreground/40 font-mono">main</span>
          </div>

          {/* Editor layout */}
          <div className="flex">
            {/* Line numbers */}
            <div className="flex flex-col items-end pr-4 pl-4 pt-5 pb-5 select-none border-r border-border/30">
              {CODE_PREVIEW.map((_, i) => (
                <span key={i} className="text-xs font-mono text-muted-foreground/30 leading-6">
                  {i + 1}
                </span>
              ))}
            </div>

            {/* Code */}
            <div className="flex-1 overflow-x-auto pt-5 pb-5 pl-4">
              {CODE_PREVIEW.map((line, i) => (
                <div
                  key={i}
                  className="text-sm font-mono leading-6 whitespace-nowrap"
                  style={{ paddingLeft: `${line.indent * 1.5}rem` }}
                >
                  <span className={line.color}>{line.text}</span>
                  <span className="text-muted-foreground">{line.rest}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Status bar */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-border/50 bg-muted/20 text-xs text-muted-foreground/50 font-mono">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                TypeScript
              </span>
              <span>UTF-8</span>
            </div>
            <div className="flex items-center gap-4">
              <span>Ln 7, Col 14</span>
              <span>2 spaces</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Language Pills ── */}
      <section className="flex flex-col items-center gap-5 px-6 pb-20">
        <p className="text-sm text-muted-foreground/60 uppercase tracking-widest font-medium">
          Supported languages
        </p>
        <div className="flex flex-wrap justify-center gap-2.5 max-w-lg">
          {LANGUAGES.map((lang) => (
            <span
              key={lang.name}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border border-border/50 bg-card/50"
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: lang.color }}
              />
              {lang.name}
            </span>
          ))}
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section className="px-6 pb-24 max-w-5xl mx-auto w-full">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight mb-3">Everything you need to code</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Velo packs a complete development environment into your browser tab.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className={`relative rounded-xl border ${f.border} bg-gradient-to-br ${f.color} p-5 flex flex-col gap-3 group hover:scale-[1.02] transition-transform`}
            >
              <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${f.iconBg}`}>
                {f.icon}
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-1">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Call-to-action Banner ── */}
      <section className="px-6 pb-24 max-w-3xl mx-auto w-full">
        <div
          className="relative rounded-2xl border border-border/50 overflow-hidden p-10 text-center flex flex-col items-center gap-6"
          style={{
            background:
              "radial-gradient(ellipse 60% 70% at 50% 50%, oklch(0.4 0.15 264 / 0.15) 0%, transparent 80%)",
          }}
        >
          <div className="absolute inset-0 border border-primary/10 rounded-2xl" />

          <h2 className="text-3xl font-bold tracking-tight">
            Ready to start building?
          </h2>
          <p className="text-muted-foreground max-w-sm leading-relaxed">
            Create a free account and launch your first project in seconds.
            Your workspace is waiting.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/register"
              id="cta-bottom-register"
              className="group inline-flex items-center gap-2 px-7 py-3 rounded-lg font-semibold text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/25 hover:scale-[1.02] active:scale-[0.98]"
            >
              Sign up for free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/login"
              id="cta-bottom-login"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-lg font-semibold text-sm border border-border hover:bg-muted/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Already have an account?
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border/50 py-6 px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground/50">
        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
          <span className="font-medium text-muted-foreground/70">Velo</span>
          <span>— Browser IDE</span>
        </div>
        <p>Built with Next.js · Tailwind CSS · Monaco Editor · xterm.js</p>
      </footer>
    </main>
  );
}
