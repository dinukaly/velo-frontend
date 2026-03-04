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

export interface AuthResponse {
    token: string;
}

export async function loginUser(data: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/auth/signin", data);
    return response.data;
}

export async function registerUser(data: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/auth/signup", data);
    return response.data;
}
