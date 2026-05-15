"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Loader2 } from "lucide-react";
import { fetchCurrentUser, UserResponse } from "@/services/authService";

interface AuthContextType {
    isAuthenticated: boolean;
    user: UserResponse | null;
    login: (user: UserResponse) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define which routes are meant for unauthenticated users
const AUTH_ROUTES = ["/login", "/register", "/check-email", "/verify-email/status", "/forgot-password"];
// Define which prefixes are protected
const PROTECTED_PREFIXES = ["/dashboard", "/project", "/admin"];
const DEFAULT_PROTECTED_REDIRECT = "/login";
const DEFAULT_AUTH_REDIRECT = "/dashboard";
const DEFAULT_ADMIN_REDIRECT = "/admin";

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { user, isAuthenticated, login, logout } = useAuthStore();
    const [isHydrated, setIsHydrated] = useState(false);
    const [isSessionChecked, setIsSessionChecked] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    // Ensure Zustand store is hydrated from localStorage before acting
    useEffect(() => {
        setIsHydrated(useAuthStore.persist.hasHydrated());
        const unsub = useAuthStore.persist.onFinishHydration(() => setIsHydrated(true));
        
        return () => {
            unsub();
        };
    }, []);

    useEffect(() => {
        if (!isHydrated) return;

        if (!isAuthenticated) {
            setIsSessionChecked(true);
            return;
        }

        let cancelled = false;
        setIsSessionChecked(false);

        fetchCurrentUser()
            .then((currentUser) => {
                if (!cancelled) {
                    login(currentUser);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    logout();
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setIsSessionChecked(true);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [isHydrated, isAuthenticated, login, logout]);

    // Perform routing logic once hydrated and session has been checked
    useEffect(() => {
        if (!isHydrated || !isSessionChecked) return;

        const isAuthRoute = AUTH_ROUTES.includes(pathname);
        const isProtectedRoute = PROTECTED_PREFIXES.some(prefix => pathname.startsWith(prefix));
        const isAdminRoute = pathname.startsWith("/admin");

        if (!isAuthenticated && isProtectedRoute) {
            router.replace(DEFAULT_PROTECTED_REDIRECT);
        } else if (isAuthenticated && isAdminRoute && user?.role !== "ADMIN") {
            router.replace(DEFAULT_AUTH_REDIRECT);
        } else if (isAuthenticated && isAuthRoute) {
            router.replace(user?.role === "ADMIN" ? DEFAULT_ADMIN_REDIRECT : DEFAULT_AUTH_REDIRECT);
        }
    }, [isHydrated, isSessionChecked, isAuthenticated, pathname, router, user?.role]);

    // Show a global loading state during hydration to avoid flashing restricted views
    if (!isHydrated || !isSessionChecked) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-background gap-6">
                <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/5 border border-primary/20 animate-pulse">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="36"
                        height="36"
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
                    {/* Pulsing ring effect */}
                    <div className="absolute inset-0 rounded-2xl border-2 border-primary/50 blur-sm animate-ping opacity-20" />
                </div>
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <p className="text-sm font-medium text-muted-foreground animate-pulse">
                        Authenticating workspace...
                    </p>
                </div>
            </div>
        );
    }

    // Maintain a loader if we are in the middle of an impending redirect
    const isAuthRoute = AUTH_ROUTES.includes(pathname);
    const isProtectedRoute = PROTECTED_PREFIXES.some(prefix => pathname.startsWith(prefix));
    const isAdminRoute = pathname.startsWith("/admin");

    if (!isAuthenticated && isProtectedRoute) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-background gap-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Redirecting to login...</p>
            </div>
        );
    }

    if (isAuthenticated && isAuthRoute) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-background gap-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Redirecting to workspace...</p>
            </div>
        );
    }

    if (isAuthenticated && isAdminRoute && user?.role !== "ADMIN") {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-background gap-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Redirecting to dashboard...</p>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
