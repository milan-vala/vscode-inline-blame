import * as cp from "child_process";
import * as path from "path";
import * as vscode from "vscode";

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

export class GitUtils {
  private static blameCache = new Map<string, Map<number, BlameInfo>>();
  private static detailedCommitCache = new Map<string, DetailedCommitInfo>();

  static async getGitBlameData(
    filePath: string
  ): Promise<Map<number, BlameInfo>> {
    if (this.blameCache.has(filePath)) {
      return this.blameCache.get(filePath)!;
    }

    return new Promise((resolve, reject) => {
      const workspaceFolder = vscode.workspace.getWorkspaceFolder(
        vscode.Uri.file(filePath)
      );
      if (!workspaceFolder) {
        reject(new Error("No workspace folder"));
        return;
      }

      const relativePath = path.relative(workspaceFolder.uri.fsPath, filePath);
      const command = `git blame --porcelain "${relativePath}"`;

      cp.exec(
        command,
        {
          cwd: workspaceFolder.uri.fsPath,
          maxBuffer: 1024 * 1024 * 10,
        },
        (error, stdout, stderr) => {
          if (error) {
            reject(error);
            return;
          }

          try {
            const blameData = this.parseGitBlameOutput(stdout);
            this.blameCache.set(filePath, blameData);
            resolve(blameData);
          } catch (parseError) {
            reject(parseError);
          }
        }
      );
    });
  }

  static async getDetailedCommitInfo(
    commitHash: string,
    filePath: string
  ): Promise<DetailedCommitInfo> {
    const cacheKey = `${commitHash}-${filePath}`;

    if (this.detailedCommitCache.has(cacheKey)) {
      return this.detailedCommitCache.get(cacheKey)!;
    }

    return new Promise((resolve, reject) => {
      const workspaceFolder = vscode.workspace.getWorkspaceFolder(
        vscode.Uri.file(filePath)
      );
      if (!workspaceFolder) {
        reject(new Error("No workspace folder"));
        return;
      }

      const commands = [
        `git show --format="%an|%ae|%ad|%cn|%ce|%s|%B" --no-patch ${commitHash}`,
        `git name-rev --name-only ${commitHash}`,
      ];

      Promise.all(
        commands.map(
          (cmd) =>
            new Promise<string>((res, rej) => {
              cp.exec(
                cmd,
                { cwd: workspaceFolder.uri.fsPath },
                (error, stdout) => {
                  if (error) rej(error);
                  else res(stdout.trim());
                }
              );
            })
        )
      )
        .then(([commitInfo, branchInfo]) => {
          const parts = commitInfo.split("|");
          const detailedInfo: DetailedCommitInfo = {
            author: parts[0] || "Unknown",
            authorEmail: parts[1] || "",
            authorDate: parts[2] || "",
            committerName: parts[3] || "",
            committerEmail: parts[4] || "",
            commitMessage: parts[5] || "",
            fullCommitMessage: parts[6] || parts[5] || "",
            commit: commitHash,
            branch: branchInfo.replace(/~\d+$/, "") || "unknown",
            date: this.formatDate(new Date(parts[2])),
            authorTime: new Date(parts[2]).getTime(),
          };

          this.detailedCommitCache.set(cacheKey, detailedInfo);
          resolve(detailedInfo);
        })
        .catch(reject);
    });
  }

  private static parseGitBlameOutput(output: string): Map<number, BlameInfo> {
    const lines = output.split("\n");
    const blameData = new Map<number, BlameInfo>();
    const commits = new Map<string, Partial<BlameInfo>>();

    let currentCommit = "";
    let currentLineNum = 0;

    for (const line of lines) {
      if (line.match(/^[a-f0-9]{40}\s+\d+\s+\d+/)) {
        const parts = line.split(/\s+/);
        currentCommit = parts[0];
        currentLineNum = parseInt(parts[2]);

        if (!commits.has(currentCommit)) {
          commits.set(currentCommit, { commit: currentCommit });
        }
      } else if (line.startsWith("author ")) {
        const author = line.substring(7);
        const commitData = commits.get(currentCommit);
        if (commitData) {
          commitData.author = author;
        }
      } else if (line.startsWith("author-mail ")) {
        const email = line.substring(12).replace(/[<>]/g, "");
        const commitData = commits.get(currentCommit);
        if (commitData) {
          commitData.authorEmail = email;
        }
      } else if (line.startsWith("author-time ")) {
        const timestamp = parseInt(line.substring(12));
        const date = new Date(timestamp * 1000);
        const commitData = commits.get(currentCommit);
        if (commitData) {
          commitData.date = this.formatDate(date);
          commitData.authorTime = timestamp;
        }
      } else if (line.startsWith("summary ")) {
        const summary = line.substring(8);
        const commitData = commits.get(currentCommit);
        if (commitData) {
          commitData.commitMessage = summary;
        }
      } else if (line.startsWith("\t")) {
        const commitData = commits.get(currentCommit);
        if (commitData && commitData.author && commitData.date) {
          blameData.set(currentLineNum, {
            author: commitData.author,
            date: commitData.date,
            commit: currentCommit.substring(0, 8),
            commitMessage: commitData.commitMessage || "No commit message",
            authorEmail: commitData.authorEmail || "",
            branch: "unknown",
            authorTime: commitData.authorTime || 0,
          });
        }
      }
    }

    return blameData;
  }

  static formatDate(date: Date): string {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return "yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months > 1 ? "s" : ""} ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  static clearCache(filePath?: string) {
    if (filePath) {
      this.blameCache.delete(filePath);
    } else {
      this.blameCache.clear();
    }
    this.detailedCommitCache.clear();
  }

  static truncateCommitMessage(
    message: string,
    maxLength: number = 50
  ): string {
    if (!message) return "No commit message";
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + "...";
  }

  static async getGitHubRepoUrl(filePath: string): Promise<string | null> {
    return new Promise((resolve) => {
      const workspaceFolder = vscode.workspace.getWorkspaceFolder(
        vscode.Uri.file(filePath)
      );
      if (!workspaceFolder) {
        resolve(null);
        return;
      }

      // Get the remote origin URL
      cp.exec(
        "git remote get-url origin",
        { cwd: workspaceFolder.uri.fsPath },
        (error, stdout) => {
          if (error) {
            resolve(null);
            return;
          }

          const remoteUrl = stdout.trim();

          // Convert various GitHub URL formats to HTTPS
          let githubUrl = null;

          if (remoteUrl.includes("github.com")) {
            if (remoteUrl.startsWith("https://github.com/")) {
              // Already HTTPS format: https://github.com/user/repo.git
              githubUrl = remoteUrl.replace(/\.git$/, "");
            } else if (remoteUrl.startsWith("git@github.com:")) {
              // SSH format: git@github.com:user/repo.git
              const match = remoteUrl.match(/git@github\.com:(.+?)(?:\.git)?$/);
              if (match) {
                githubUrl = `https://github.com/${match[1]}`;
              }
            }
          }

          resolve(githubUrl);
        }
      );
    });
  }
}
