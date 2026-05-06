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

export interface UserResponse {
    id?: string;
    name?: string;
    email?: string;
}

export async function loginUser(data: LoginRequest): Promise<UserResponse> {
    const response = await api.post<UserResponse>("/v1/auth/signin", data);
    return response.data;
}

export async function registerUser(data: RegisterRequest): Promise<UserResponse> {
    const response = await api.post<UserResponse>("/v1/auth/signup", data);
    return response.data;
}

export async function logoutUser(): Promise<void> {
    await api.post("/v1/auth/logout");
}
