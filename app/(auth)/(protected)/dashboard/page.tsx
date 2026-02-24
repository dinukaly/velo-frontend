import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Dashboard — Velo",
    description: "Your Velo project dashboard",
};

export default function DashboardPage() {
    return (
        <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
            <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="28"
                        height="28"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-primary"
                    >
                        <rect width="7" height="9" x="3" y="3" rx="1" />
                        <rect width="7" height="5" x="14" y="3" rx="1" />
                        <rect width="7" height="9" x="14" y="12" rx="1" />
                        <rect width="7" height="5" x="3" y="16" rx="1" />
                    </svg>
                </div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="max-w-md text-muted-foreground">
                    Your project overview and workspace will be displayed here.
                </p>
            </div>

            {/* Placeholder content grid */}
            <div className="grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
                {["Projects", "Files", "Settings"].map((label) => (
                    <div
                        key={label}
                        className="rounded-xl border border-dashed border-border bg-muted/40 px-6 py-8 text-center"
                    >
                        <p className="text-sm font-medium text-muted-foreground">
                            {label} — coming soon
                        </p>
                    </div>
                ))}
            </div>
        </main>
    );
}
