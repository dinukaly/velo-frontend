export type FileNodeType = "file" | "folder";

export interface FileNode {
    id: string;
    name: string;
    type: FileNodeType;
    children?: FileNode[];
}
