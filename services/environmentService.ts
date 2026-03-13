import api from "@/services/api";

/*
 * Environment Service
 * Handles project runtime environment (containers, sandbox, etc.)
 */

/*
 * starts the sandbox container.
 */
export async function openEnvironment(projectId: string): Promise<void> {
    await api.post(`/environment/open/${projectId}`);
}

/*
 * to stop containers and cleanup workspace.
 */
export async function closeEnvironment(projectId: string): Promise<void> {
    await api.post(`/environment/close/${projectId}`, {});
}
