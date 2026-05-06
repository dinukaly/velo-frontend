"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { UserResponse } from "@/services/authService";

interface AuthState {
    /** Authenticated user details. Null when unauthenticated. */
    user: UserResponse | null;
    /** Convenience boolean derived from user presence. */
    isAuthenticated: boolean;
    /** Set the user and mark as authenticated. */
    login: (user: UserResponse) => void;
    /** Clear the user and mark as unauthenticated. */
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,

            login: (user: UserResponse) =>
                set({
                    user,
                    isAuthenticated: true,
                }),

            logout: () =>
                set({
                    user: null,
                    isAuthenticated: false,
                }),
        }),
        {
            name: "browser-ide-auth",             // localStorage key
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({             // only persist what matters
                user: state.user,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);
