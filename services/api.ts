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
    baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api",
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true,
    timeout: 30_000,
});

export interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
    _retry?: boolean;
}

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function shouldSkipRefresh(url?: string) {
    return url?.includes("/v1/auth/") ?? false;
}

function subscribeTokenRefresh(cb: (token: string) => void) {
    refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
    refreshSubscribers.map((cb) => cb(token));
    refreshSubscribers = [];
}

// Response Interceptor
// 1. Unwraps the backend's APIResponse wrapper so every service receives the
//    plain payload directly via `response.data`.
// 2. Handles 401 Unauthorized via refresh token logic and retries.
api.interceptors.response.use(
    (response: AxiosResponse) => {
        // Transparently unwrap { status, message, data } → data
        if (isApiResponse(response.data)) {
            response.data = response.data.data;
        }
        return response;
    },
    async (error: AxiosError) => {
        const originalRequest = error.config as CustomAxiosRequestConfig;

        if (!originalRequest) {
            return Promise.reject(error);
        }

        // Auth endpoints should surface their own 401 payloads directly to the UI.
        if (shouldSkipRefresh(originalRequest.url)) {
            return Promise.reject(error);
        }

        if (error.response?.status === 401 && !originalRequest._retry) {
            console.log("401 detected → attempting refresh");
            

            if (isRefreshing) {
                console.log("Refresh already in progress → queuing request");
                return new Promise((resolve) => {
                    subscribeTokenRefresh(() => {
                        resolve(api(originalRequest));
                    });
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Call the refresh endpoint to obtain a new access token (cookie)
                await api.post("/v1/auth/refresh");
                console.log("refresh success");

                isRefreshing = false;
                onRefreshed(""); // Cookies are updated automatically

                // Retry the original request
                return api(originalRequest);
            } catch (refreshError) {
                console.log("refresh failed", refreshError);
                isRefreshing = false;
                refreshSubscribers = [];

                // If token refresh fails, clear auth state and redirect to login
                useAuthStore.getState().logout();
                if (typeof window !== "undefined") {
                    window.location.href = "/login";
                }

                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
