import api from "@/services/api";

export type AdminRole = "USER" | "ADMIN";

export interface AdminStats {
    totalUsers: number;
    enabledUsers: number;
    disabledUsers: number;
    adminUsers: number;
    totalProjects: number;
    activeSandboxes: number;
}

export interface AdminUser {
    id: string;
    name: string;
    email: string;
    role: AdminRole;
    enabled: boolean;
    createdAt: string;
    projectCount: number;
}

export interface AdminProject {
    id: string;
    name: string;
    description: string;
    language: string;
    createdAt: string;
    updatedAt: string;
    ownerId: string;
    ownerName: string;
    ownerEmail: string;
}

export interface UpdateAdminUserPayload {
    role?: AdminRole;
    enabled?: boolean;
}

export async function fetchAdminStats(): Promise<AdminStats> {
    const response = await api.get<AdminStats>("/v1/admin/stats");
    return response.data;
}

export async function fetchAdminUsers(): Promise<AdminUser[]> {
    const response = await api.get<AdminUser[]>("/v1/admin/users");
    return response.data;
}

export async function updateAdminUser(id: string, payload: UpdateAdminUserPayload): Promise<AdminUser> {
    const response = await api.patch<AdminUser>(`/v1/admin/users/${id}`, payload);
    return response.data;
}

export async function fetchAdminProjects(): Promise<AdminProject[]> {
    const response = await api.get<AdminProject[]>("/v1/admin/projects");
    return response.data;
}

export async function deleteAdminProject(id: string): Promise<void> {
    await api.delete(`/v1/admin/projects/${id}`);
}
