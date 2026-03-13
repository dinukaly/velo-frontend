import api from "@/services/api";
import type { FileNode } from "@/types/fileTree";

//Request / Response Types 

/**
 * POST /api/v1/files/file  →  CreateFileRequestDTO
 */
export interface CreateFileRequest {
    projectId: string;
    parentId: string | null;
    name: string;
}

/**
 * POST /api/v1/files/folder 
 */
export interface CreateFolderRequest {
    projectId: string;
    parentId: string | null;
    name: string;
}

/**
 * PATCH /api/v1/files/{nodeId}/rename
 */
export interface RenameRequest {
    newName: string;
}

/**
 * PUT /api/v1/files/content  
 */
export interface WriteFileRequest {
    nodeId: string;
    content: string;
}

/**
 * GET /api/v1/files/{nodeId}/content 
 */
export interface FileContentResponse {
    nodeId: string;
    name: string;
    content: string;
}

/**
 * Response shape for create/rename operations.
 */
export interface FileNodeResponse {
    id: string;
    name: string;
    type: "FILE" | "FOLDER"; 
    projectId: string;
    parentId: string | null;
    children: FileNodeResponse[];
    createdAt: string;
    updatedAt: string;
}

//File Service

/**
 * GET /api/v1/files/tree/{projectId}
 */
export async function fetchFileTree(projectId: string): Promise<FileNode[]> {
    const response = await api.get<FileNode[]>(`/files/tree/${projectId}`);
    return response.data;
}

/**
 * GET /api/v1/files/{nodeId}/content
 */
export async function loadFileContent(
    _projectId: string,   // kept for call-site compatibility
    fileId: string
): Promise<string> {
    const response = await api.get<FileContentResponse>(`/files/${fileId}/content`);
    return response.data.content;
}

/**
 * PUT /api/v1/files/content
 */
export async function saveFileContent(
    _projectId: string, 
    fileId: string,
    payload: { content: string }
): Promise<void> {
    await api.put(`/files/content`, {
        nodeId: fileId,
        content: payload.content,
    });
}

/**
 * POST /api/v1/files/file
 */
export async function createFile(req: CreateFileRequest): Promise<FileNodeResponse> {
    const response = await api.post<FileNodeResponse>(`/files/file`, req);
    return response.data;
}

/**
 * POST /api/v1/files/folder
 */
export async function createFolder(req: CreateFolderRequest): Promise<FileNodeResponse> {
    const response = await api.post<FileNodeResponse>(`/files/folder`, req);
    return response.data;
}

/**
 * DELETE /api/v1/files/{nodeId}
 *
 * Response data: null
 */
export async function deleteNode(nodeId: string): Promise<void> {
    await api.delete(`/files/${nodeId}`);
}

/**
 * PATCH /api/v1/files/{nodeId}/rename
 */
export async function renameNode(nodeId: string, newName: string): Promise<FileNodeResponse> {
    const response = await api.patch<FileNodeResponse>(`/files/${nodeId}/rename`, {
        newName,
    });
    return response.data;
}
