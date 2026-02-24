import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/store/authStore";

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api",
    headers: {
        "Content-Type": "application/json",
    },
    timeout: 10_000,
});

// Request Interceptor
// Attaches the JWT token from the Zustand store to every outgoing request.
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // getState() reads directly from the store without subscribing to a React hook,
        // making it safe to call outside of React components.
        const token = useAuthStore.getState().token;

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error: AxiosError) => Promise.reject(error)
);

// Response Interceptor
// Handles global error responses, e.g. auto-logout on 401 Unauthorized.
api.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        if (error.response?.status === 401) {
            // Token has expired or is invalid — clear auth state.
            useAuthStore.getState().logout();

            // Only redirect if running in the browser.
            if (typeof window !== "undefined") {
                window.location.href = "/login";
            }
        }

        return Promise.reject(error);
    }
);

export default api;
