import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/store/authStore";

export interface APIResponse<T = unknown> {
    status: number;
    message: string;
    data: T;
}

//check if the response body is an APIResponse wrapper
function isApiResponse(body: unknown): body is APIResponse {
    return (
        typeof body === "object" &&
        body !== null &&
        "status" in body &&
        "message" in body &&
        "data" in body
    );
}

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1",
    headers: {
        "Content-Type": "application/json",
    },
    timeout: 10_000,
});

// Request Interceptor
// Attaches the JWT token from the Zustand store to every outgoing request.
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = useAuthStore.getState().token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error: AxiosError) => Promise.reject(error)
);

// Response Interceptor
// 1. Unwraps the backend's APIResponse wrapper so every service receives the
//    plain payload directly via `response.data`.
// 2. Auto-logouts on 401 Unauthorized.
api.interceptors.response.use(
    (response: AxiosResponse) => {
        // Transparently unwrap { status, message, data } → data
        if (isApiResponse(response.data)) {
            response.data = response.data.data;
        }
        return response;
    },
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
