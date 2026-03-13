export type FileNodeType = "file" | "folder";

/**
 * Represents a node in the project file tree.
 */
export interface FileNode {
    id: string;
    name: string;
    type: FileNodeType;
    children?: FileNode[];
    parentId?: string | null;
    projectId?: string;
    createdAt?: string;
    updatedAt?: string;
}
