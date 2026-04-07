import api from "@/services/api";
import type { FileNode } from "@/types/fileTree";

// Request / Response Types (v2 - Filesystem-First)

export interface CreateFileRequest {
    projectId: string;
    parentPath: string; // The parent directory path
    name: string;
}

export interface CreateFolderRequest {
    projectId: string;
    parentPath: string; // The parent directory path
    name: string;
}

export interface RenameRequest {
    projectId: string;
    path: string; // The current relative path
    newName: string;
}

export interface WriteFileRequest {
    projectId: string;
    path: string;
    content: string;
}

export interface FileContentResponse {
    path: string;
    name: string;
    content: string;
}

/**
 * Response shape for V2 operations.
 * Backend V2 typically returns the updated node or metadata.
 */
export interface FileNodeResponse {
    path: string; // This is the relative path
    name: string;
    type: "FILE" | "FOLDER";
    projectId: string;
    children?: FileNodeResponse[];
}

// File Service (v2)

/**
 * GET /api/v2/files/tree/{projectId}?path=
 * Lists one directory level (lazy loading).
 */
export async function fetchFileTree(projectId: string, path: string = ""): Promise<FileNode[]> {
    const response = await api.get<FileNode[]>(`/v2/files/tree/${projectId}`, {
        params: { path }
    });
    return response.data;
}

/**
 * GET /api/v2/files/content?projectId=&path=
 */
export async function loadFileContent(
    projectId: string,
    path: string
): Promise<string> {
    const response = await api.get<FileContentResponse>(`/v2/files/content`, {
        params: { projectId, path }
    });
    return response.data.content;
}

/**
 * PUT /api/v2/files/content
 */
export async function saveFileContent(
    projectId: string,
    path: string,
    content: string
): Promise<void> {
    await api.put(`/v2/files/content`, {
        projectId,
        path,
        content,
    });
}

/**
 * POST /api/v2/files/file
 */
export async function createFile(req: CreateFileRequest): Promise<FileNodeResponse> {
    const response = await api.post<FileNodeResponse>(`/v2/files/file`, req);
    return response.data;
}

/**
 * POST /api/v2/files/folder
 */
export async function createFolder(req: CreateFolderRequest): Promise<FileNodeResponse> {
    const response = await api.post<FileNodeResponse>(`/v2/files/folder`, req);
    return response.data;
}

/**
 * DELETE /api/v2/files?projectId=&path=
 */
export async function deleteNode(projectId: string, path: string): Promise<void> {
    await api.delete(`/v2/files`, {
        params: { projectId, path }
    });
}

/**
 * PUT /api/v2/files/rename
 */
export async function renameNode(projectId: string, path: string, newName: string): Promise<FileNodeResponse> {
    const response = await api.put<FileNodeResponse>(`/v2/files/rename`, {
        projectId,
        path,
        newName,
    });
    return response.data;
}
