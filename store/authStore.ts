"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface AuthState {
    /** JWT token returned by the server. Null when unauthenticated. */
    token: string | null;
    /** Convenience boolean derived from token presence. */
    isAuthenticated: boolean;
    /** Set the token and mark the user as authenticated. */
    login: (token: string) => void;
    /** Clear the token and mark the user as unauthenticated. */
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            token: null,
            isAuthenticated: false,

            login: (token: string) =>
                set({
                    token,
                    isAuthenticated: true,
                }),

            logout: () =>
                set({
                    token: null,
                    isAuthenticated: false,
                }),
        }),
        {
            name: "browser-ide-auth",             // localStorage key
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({             // only persist what matters
                token: state.token,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);
