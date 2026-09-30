"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUpRight, Command, GitBranch, Terminal } from "lucide-react";
import { WorkspacePreview } from "@/components/landing/WorkspacePreview";
import { useAuthStore } from "@/store/authStore";
import "./landing.css";

const capabilities = [
  {
    number: "01",
    icon: Command,
    title: "Edit the files that matter.",
    description: "Open your project in a multi-tab code editor with a file tree beside it.",
  },
  {
    number: "02",
    icon: Terminal,
    title: "Run it in the same workspace.",
    description: "Use the built-in terminal to work inside your project's isolated environment.",
  },
  {
    number: "03",
    icon: GitBranch,
    title: "Review what the agent changes.",
    description: "Inspect proposed diffs and choose which edits to apply to your files.",
  },
];

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const redirectIfAuthenticated = () => {
      if (useAuthStore.persist.hasHydrated() && useAuthStore.getState().isAuthenticated) {
        router.replace("/dashboard");
      }
    };

    redirectIfAuthenticated();
    return useAuthStore.persist.onFinishHydration(redirectIfAuthenticated);
  }, [router]);

  return (
    <main className="velo-landing">
      <div className="landing-grain" aria-hidden="true" />

      <header className="landing-header">
        <nav className="landing-nav" aria-label="Main navigation">
          <Link href="/" className="landing-brand" aria-label="Velo home">
            <span className="landing-brand-mark" aria-hidden="true">V</span>
            <span>velo<span className="landing-brand-period">.</span></span>
          </Link>
          <div className="landing-nav-links">
            <a href="#workspace">Workspace</a>
            <a href="#how-it-works">How it works</a>
            <Link href="/login">Sign in</Link>
          </div>
          <Link href="/register" className="landing-nav-cta">
            Get started <ArrowUpRight size={14} strokeWidth={1.8} />
          </Link>
        </nav>
      </header>

      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="landing-hero-inner">
          <div className="landing-eyebrow">
            <span className="landing-eyebrow-dot" />
            THE BROWSER IDE FOR REAL PROJECTS
          </div>
          <h1 id="landing-title" className="landing-title">
            <span>Your workspace.</span>
            <em>In your browser.</em>
          </h1>
          <p className="landing-hero-description">
            Open a project, edit files, run commands, and review AI changes
            from one workspace.
          </p>
          <div className="landing-hero-actions">
            <Link href="/register" className="landing-primary-button" id="cta-create-account">
              Open your workspace <ArrowUpRight size={17} strokeWidth={1.8} />
            </Link>
            <a href="#how-it-works" className="landing-text-link">
              See how it works <ArrowDown size={15} strokeWidth={1.7} />
            </a>
          </div>
        </div>
        <div id="workspace" className="landing-hero-preview">
          <div className="landing-preview-label">
            <span><span className="landing-live-dot" /> THE VELO WORKSPACE</span>
            <span>EDITOR / TERMINAL / AGENT</span>
          </div>
          <WorkspacePreview />
        </div>
      </section>

      <section id="how-it-works" className="landing-capabilities" aria-labelledby="capabilities-title">
        <div className="landing-kicker"><span>01</span> / THE WAY IT WORKS</div>
        <h2 id="capabilities-title">One project.<br /><em>One place to build it.</em></h2>
        <div className="landing-capability-list">
          {capabilities.map((item) => {
            const Icon = item.icon;
            return (
              <div className="landing-capability" key={item.number}>
                <span className="landing-capability-number">{item.number}</span>
                <div className="landing-capability-icon"><Icon size={21} strokeWidth={1.35} /></div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="landing-final-cta" aria-labelledby="final-cta-title">
        <div className="landing-kicker"><span>02</span> / OPEN VELO</div>
        <h2 id="final-cta-title">Your next project<br />starts here<span>.</span></h2>
        <p>Open a workspace in your browser.</p>
        <Link href="/register" className="landing-primary-button" id="cta-bottom-register">
          Get started <ArrowUpRight size={17} strokeWidth={1.8} />
        </Link>
      </section>

      <footer className="landing-footer">
        <span className="landing-footer-brand">velo<span>.</span></span>
        <span>YOUR BROWSER WORKSPACE.</span>
        <span>© {new Date().getFullYear()} VELO</span>
      </footer>
    </main>
  );
}
