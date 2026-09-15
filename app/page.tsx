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
  ArrowRight,
  ChevronRight,
  GitBranch,
  Shield,
} from "lucide-react";
import { AnimatedCodePreview } from "@/components/landing/AnimatedCodePreview";

const FEATURES = [
  {
    icon: <Code2 className="w-5 h-5" />,
    title: "Monaco Editor Core",
    desc: "VS Code editor foundation with multi-cursor editing, bracket pair colorization, syntax highlighting, and keyboard shortcuts.",
    color: "from-blue-500/20 to-blue-600/5",
    border: "border-blue-500/20",
    iconBg: "bg-blue-500/10 text-blue-400",
  },
  {
    icon: <Terminal className="w-5 h-5" />,
    title: "Interactive xterm.js Shell",
    desc: "Direct low-latency WebSocket PTY connection to your Linux container with ANSI colors, process signals, and raw shell access.",
    color: "from-emerald-500/20 to-emerald-600/5",
    border: "border-emerald-500/20",
    iconBg: "bg-emerald-500/10 text-emerald-400",
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: "AI Coding Agent & Diff Review",
    desc: "Prompt the agent to inspect the codebase via hybrid search, generate multi-file edits, and review/accept diff hunks safely.",
    color: "from-purple-500/20 to-purple-600/5",
    border: "border-purple-500/20",
    iconBg: "bg-purple-500/10 text-purple-400",
  },
  {
    icon: <Shield className="w-5 h-5" />,
    title: "Isolated Docker Sandboxes",
    desc: "Each project boots inside a dedicated container with its own filesystem, allocated memory, and persistent volume storage.",
    color: "from-rose-500/20 to-rose-600/5",
    border: "border-rose-500/20",
    iconBg: "bg-rose-500/10 text-rose-400",
  },
  {
    icon: <FolderOpen className="w-5 h-5" />,
    title: "Workspace File Explorer",
    desc: "Hierarchical file tree with dirty-state tracking, multi-tab switching, inline file management, and instant server sync.",
    color: "from-amber-500/20 to-amber-600/5",
    border: "border-amber-500/20",
    iconBg: "bg-amber-500/10 text-amber-400",
  },
  {
    icon: <GitBranch className="w-5 h-5" />,
    title: "Git Status & Diff Viewer",
    desc: "Inspect working tree modifications, review side-by-side git diffs, stage files, and commit directly within the editor.",
    color: "from-cyan-500/20 to-cyan-600/5",
    border: "border-cyan-500/20",
    iconBg: "bg-cyan-500/10 text-cyan-400",
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
          Cloud Development Environment · Zero Local Setup
        </div>

        {/* Headline */}
        <div className="flex flex-col gap-4 max-w-3xl">
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-[1.1]">
            Code, build, and run in your{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, oklch(0.75 0.18 264), oklch(0.65 0.22 300))",
              }}
            >
              browser.
            </span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            A complete development environment in your browser. Clone repositories, run servers, and write code from anywhere, without spending a second on local setup.
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Link
            href="/register"
            id="cta-create-account"
            className="group inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/25 hover:scale-[1.02] active:scale-[0.98]"
          >
            Start coding for free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link
            href="/login"
            id="cta-sign-in"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm border border-border hover:bg-muted/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Sign in to workspace
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </Link>
        </div>

        {/* Social proof */}
        <p className="text-xs text-muted-foreground/60">
          Dedicated container per project · Interactive PTY terminal · Git diff review
        </p>
      </section>

      {/* ── Code Preview Window ── */}
      <section className="flex justify-center px-6 pb-20">
        <AnimatedCodePreview />
      </section>

      {/* ── Language Pills ── */}
      <section className="flex flex-col items-center gap-5 px-6 pb-20">
        <p className="text-sm text-muted-foreground/60 uppercase tracking-widest font-medium">
          Supported runtimes
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
          <h2 className="text-3xl font-bold tracking-tight mb-3">Engineered for real development</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            From the editor core to the container runtime, every layer is designed for speed and control.
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
            Spin up your workspace
          </h2>
          <p className="text-muted-foreground max-w-sm leading-relaxed">
            Create a project, launch an interactive shell, and start building in seconds.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/register"
              id="cta-bottom-register"
              className="group inline-flex items-center gap-2 px-7 py-3 rounded-lg font-semibold text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/25 hover:scale-[1.02] active:scale-[0.98]"
            >
              Get started for free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/login"
              id="cta-bottom-login"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-lg font-semibold text-sm border border-border hover:bg-muted/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Sign in to account
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border/50 py-8 px-6 bg-background/40">
        <div className="max-w-6xl mx-auto flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-5 h-5 rounded bg-primary/10 border border-primary/20 text-primary">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
            </div>
            <span className="font-semibold text-foreground tracking-tight">Velo</span>
          </div>
          <span className="text-border/80">·</span>
          <span className="text-muted-foreground/60">
            &copy; {new Date().getFullYear()} Velo. All rights reserved.
          </span>
        </div>
      </footer>
    </main>
  );
}
