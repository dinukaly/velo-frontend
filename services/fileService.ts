import api from "@/services/api";
import type { FileNode } from "@/types/fileTree";

// Request / Response Types 

/**
 * Payload sent to the backend when saving a file.
 * PUT /projects/:projectId/files/:fileId/content
 */
export interface SaveFileRequest {
    /** The full file content to persist. */
    content: string;
}

/**
 * Backend response after a successful file save.
 */
export interface SaveFileResponse {
    /** ISO timestamp of when the file was last saved. */
    updatedAt: string;
}

//File Service 

/**
 * GET /projects/:projectId/fil
 */
export async function fetchFileTree(projectId: string): Promise<FileNode[]> {
    const response = await api.get<FileNode[]>(`/files/tree/${projectId}`);
    return response.data;
}

/**
 * GET /api/v1/files/:nodeId/content
 *
 * Returns the raw text content of a single file.
 */
export async function loadFileContent(
    projectId: string,
    fileId: string
): Promise<string> {
    const response = await api.get<string>(
        `/files/${fileId}/content`
    );
    return response.data;
}

/**
 * PUT /api/v1/files/content
 *
 * Persists the full content of a file.
 */
export async function saveFileContent(
    projectId: string,
    fileId: string,
    payload: SaveFileRequest
): Promise<SaveFileResponse> {
    const response = await api.put<SaveFileResponse>(
        `/files/content`,
        {
            nodeId: fileId,
            content: payload.content
        }
    );
    return response.data;
}
