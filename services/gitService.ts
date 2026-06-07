import api from "@/services/api";
import type { GitBranches, GitCommit, GitDiff, GitStatus } from "@/types/git";

export async function initGitRepository(projectId: string): Promise<GitStatus> {
  const response = await api.post<GitStatus>(`/v1/git/${projectId}/init`);
  return response.data;
}

export async function fetchGitStatus(projectId: string): Promise<GitStatus> {
  const response = await api.get<GitStatus>(`/v1/git/${projectId}/status`);
  return response.data;
}

export async function fetchGitDiff(
  projectId: string,
  path?: string,
  staged = false
): Promise<GitDiff> {
  const response = await api.get<GitDiff>(`/v1/git/${projectId}/diff`, {
    params: { path, staged },
  });
  return response.data;
}

export async function stageGitPaths(
  projectId: string,
  paths: string[] = []
): Promise<GitStatus> {
  const response = await api.post<GitStatus>(`/v1/git/${projectId}/stage`, {
    paths,
  });
  return response.data;
}

export async function unstageGitPaths(
  projectId: string,
  paths: string[] = []
): Promise<GitStatus> {
  const response = await api.post<GitStatus>(`/v1/git/${projectId}/unstage`, {
    paths,
  });
  return response.data;
}

export async function commitGitChanges(
  projectId: string,
  message: string
): Promise<GitCommit> {
  const response = await api.post<GitCommit>(`/v1/git/${projectId}/commit`, {
    message,
  });
  return response.data;
}

export async function fetchGitLog(
  projectId: string,
  limit = 20
): Promise<GitCommit[]> {
  const response = await api.get<GitCommit[]>(`/v1/git/${projectId}/log`, {
    params: { limit },
  });
  return response.data;
}

export async function fetchGitBranches(projectId: string): Promise<GitBranches> {
  const response = await api.get<GitBranches>(`/v1/git/${projectId}/branches`);
  return response.data;
}

export async function createGitBranch(
  projectId: string,
  name: string,
  checkout = true
): Promise<GitBranches> {
  const response = await api.post<GitBranches>(`/v1/git/${projectId}/branches`, {
    name,
    checkout,
  });
  return response.data;
}

export async function checkoutGitBranch(
  projectId: string,
  branch: string
): Promise<GitBranches> {
  const response = await api.post<GitBranches>(`/v1/git/${projectId}/checkout`, {
    branch,
  });
  return response.data;
}
