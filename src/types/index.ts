export interface BlameInfo {
  author: string;
  date: string;
  commit: string;
  commitMessage: string;
  authorEmail: string;
  branch: string;
  authorTime: number;
}

export interface DetailedCommitInfo extends BlameInfo {
  fullCommitMessage: string;
  authorDate: string;
  committerName: string;
  committerEmail: string;
}

export interface GitBlameConfig {
  showAuthor: boolean;
  showDate: boolean;
  showCommit: boolean;
  showCommitMessage: boolean;
  maxAuthorLength: number;
  maxCommitMessageLength: number;
  enabled: boolean;
  showOnlyCurrentLine: boolean;
  showCodeLens: boolean;
}
