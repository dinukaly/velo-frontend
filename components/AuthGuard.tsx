"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

/**
 * AuthGuard
 *
 * A client-side route protection component.
 *
 * Behaviour:
 *  - If the user is NOT authenticated and visits a protected route → redirect to /login
 *  - If the user IS authenticated and visits an auth route (/login, /register) → redirect to /dashboard
 *
 * The `mounted` ref prevents acting on stale server rendered state before
 * Zustand has rehydrated from localStorage, avoiding hydration mismatches.
 */

const AUTH_ROUTES = ["/login", "/register"];
const DEFAULT_PROTECTED_REDIRECT = "/login";
const DEFAULT_AUTH_REDIRECT = "/dashboard";

interface AuthGuardProps {
    children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
    const router = useRouter();
    const pathname = usePathname();
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const mounted = useRef(false);

    useEffect(() => {
        mounted.current = true;
    }, []);

    useEffect(() => {
        if (!mounted.current) return;

        const isAuthRoute = AUTH_ROUTES.includes(pathname);

        if (!isAuthenticated && !isAuthRoute) {
            router.replace(DEFAULT_PROTECTED_REDIRECT);
        } else if (isAuthenticated && isAuthRoute) {
            router.replace(DEFAULT_AUTH_REDIRECT);
        }
    }, [isAuthenticated, pathname, router]);

    return <>{children}</>;
}
