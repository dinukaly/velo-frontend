import api from "@/services/api";
import type { Project } from "@/types/project";

//  Request / Response Types 

export type CreateProjectPayload = Omit<Project, "id" | "createdAt" | "updatedAt">;

// Project Service

/**
 * GET /projects
 *
 * Returns all projects belonging to the authenticated user.
 */
export async function fetchProjects(): Promise<Project[]> {
    const response = await api.get<Project[]>("/projects/list");
    return response.data;
}

/**
 * POST /projects
 *
 * Creates a new project and returns the created entity.
 */
export async function createProject(payload: CreateProjectPayload): Promise<Project> {
    const response = await api.post<Project>("/projects/create", payload);
    return response.data;
}

/**
 * DELETE /projects/:id
 *
 * Deletes the project with the given ID.
 */
export async function deleteProject(id: string): Promise<void> {
    await api.delete(`/projects/${id}`);
}

/**
 * GET /projects/:id
 *
 * Returns a single project by ID.
 */
export async function fetchProjectById(id: string): Promise<Project> {
    const response = await api.get<Project>(`/projects/${id}`);
    return response.data;
}
