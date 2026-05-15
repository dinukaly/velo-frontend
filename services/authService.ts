import api from "@/services/api";

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    name: string;
    email: string;
    password: string;
}

export interface ForgotPasswordRequest {
    email: string;
}

export interface ResetPasswordRequest {
    token: string;
    password: string;
}

export interface UserResponse {
    id?: string;
    name?: string;
    email?: string;
    role?: "USER" | "ADMIN";
}

export async function loginUser(data: LoginRequest): Promise<UserResponse> {
    const response = await api.post<UserResponse>("/v1/auth/signin", data);
    return response.data;
}

export async function fetchCurrentUser(): Promise<UserResponse> {
    const response = await api.get<UserResponse>("/v1/auth/me");
    return response.data;
}

export async function registerUser(data: RegisterRequest): Promise<UserResponse> {
    const response = await api.post<UserResponse>("/v1/auth/signup", data);
    return response.data;
}

export async function logoutUser(): Promise<void> {
    await api.post("/v1/auth/logout");
}

export async function resendVerification(email: string): Promise<void> {
    await api.post("/v1/auth/resend-verification", { email });
}

export async function requestPasswordReset(data: ForgotPasswordRequest): Promise<void> {
    await api.post("/v1/auth/forgot-password", data);
}

export async function resetPassword(data: ResetPasswordRequest): Promise<void> {
    await api.post("/v1/auth/reset-password", data);
}
