"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";

export default function DashboardPage() {
    const router = useRouter();
    const logout = useAuthStore((state) => state.logout);

    function handleLogout() {
        logout();
        router.replace("/login");
    }

    return (
        <div className="flex flex-col min-h-screen">
            {/* Top bar */}
            <header className="flex items-center justify-between border-b border-border bg-card/40 px-6 py-3 backdrop-blur-sm">
                <div className="flex items-center gap-2.5 text-sm font-semibold tracking-tight">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-primary"
                    >
                        <polyline points="16 18 22 12 16 6" />
                        <polyline points="8 6 2 12 8 18" />
                    </svg>
                    Velo
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="text-muted-foreground hover:text-foreground"
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                </Button>
            </header>

            {/* Main content */}
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
                        Your project overview and workspace will appear here.
                    </p>
                </div>

                {/* Placeholder cards */}
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
        </div>
    );
}
