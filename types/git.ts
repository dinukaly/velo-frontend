export interface GitFileChange {
  path: string;
  status: "ADDED" | "MODIFIED" | "DELETED" | "UNTRACKED" | "CONFLICT" | string;
}

export interface GitStatus {
  repositoryInitialized: boolean;
  currentBranch: string | null;
  clean: boolean;
  stagedChanges: GitFileChange[];
  unstagedChanges: GitFileChange[];
  untrackedFiles: GitFileChange[];
  conflictingFiles: GitFileChange[];
}

export interface GitDiff {
  path: string | null;
  staged: boolean;
  diff: string;
  truncated: boolean;
}

export interface GitCommit {
  id: string;
  shortId: string;
  message: string;
  authorName: string | null;
  authorEmail: string | null;
  commitTime: string;
}

export interface GitBranches {
  currentBranch: string | null;
  branches: string[];
}
