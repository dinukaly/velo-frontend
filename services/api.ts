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

interface CsrfTokenResponse {
    token: string;
    headerName: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api";
const SAFE_HTTP_METHODS = new Set(["get", "head", "options"]);

const csrfClient = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    timeout: 30_000,
});

let csrfToken: string | null = null;
let csrfHeaderName = "X-XSRF-TOKEN";
let csrfRequest: Promise<void> | null = null;

function isUnsafeMethod(method?: string) {
    return !SAFE_HTTP_METHODS.has((method ?? "get").toLowerCase());
}

async function loadCsrfToken(): Promise<void> {
    const response = await csrfClient.get<APIResponse<CsrfTokenResponse>>("/v1/auth/csrf");
    const payload = isApiResponse(response.data) ? response.data.data : response.data;

    csrfToken = payload.token;
    csrfHeaderName = payload.headerName;
}

async function ensureCsrfToken(forceRefresh = false): Promise<void> {
    if (forceRefresh) {
        csrfToken = null;
    }
    if (csrfToken) return;

    if (!csrfRequest) {
        csrfRequest = loadCsrfToken().finally(() => {
            csrfRequest = null;
        });
    }
    await csrfRequest;
}

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true,
    timeout: 30_000,
});

export interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
    _retry?: boolean;
    _csrfRetry?: boolean;
}

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function shouldSkipRefresh(url?: string) {
    if (!url) return false;

    return [
        "/v1/auth/signin",
        "/v1/auth/signup",
        "/v1/auth/refresh",
        "/v1/auth/logout",
        "/v1/auth/resend-verification",
        "/v1/auth/forgot-password",
        "/v1/auth/reset-password",
    ].some((endpoint) => url.includes(endpoint));
}

function subscribeTokenRefresh(cb: (token: string) => void) {
    refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
    refreshSubscribers.map((cb) => cb(token));
    refreshSubscribers = [];
}

api.interceptors.request.use(async (config) => {
    if (isUnsafeMethod(config.method)) {
        await ensureCsrfToken();
        config.headers.set(csrfHeaderName, csrfToken);
    }
    return config;
});

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

        if (
            error.response?.status === 403 &&
            error.response.headers["x-csrf-error"] === "true" &&
            isUnsafeMethod(originalRequest.method) &&
            !originalRequest._csrfRetry
        ) {
            originalRequest._csrfRetry = true;
            await ensureCsrfToken(true);
            originalRequest.headers.set(csrfHeaderName, csrfToken);
            return api(originalRequest);
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
