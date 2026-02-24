import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Login — Velo",
    description: "Sign in to your Velo account",
};

export default function LoginPage() {
    return (
        <div className="w-full max-w-sm space-y-6 rounded-2xl border border-border bg-card p-8 shadow-xl">
            {/* Logo */}
            <div className="flex flex-col items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-primary"
                    >
                        <polyline points="16 18 22 12 16 6" />
                        <polyline points="8 6 2 12 8 18" />
                    </svg>
                </div>
                <div className="text-center">
                    <h1 className="text-2xl font-bold tracking-tight">Velo</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Sign in to your account
                    </p>
                </div>
            </div>

            {/* Placeholder form notice */}
            <div className="rounded-lg border border-dashed border-border bg-muted/40 px-4 py-6 text-center">
                <p className="text-sm text-muted-foreground">
                    Login form — coming soon
                </p>
            </div>
        </div>
    );
}
