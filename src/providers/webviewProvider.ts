import * as vscode from "vscode";
import { DetailedCommitInfo } from "../utils/gitUtils";
import { AvatarUtils } from "../utils/avatarUtils";

export class WebviewProvider {
  static createCommitDetailsHtml(
    info: DetailedCommitInfo,
    repoUrl?: string | null
  ): string {
    const avatarUrl = AvatarUtils.getAvatarUrlForWebview(
      info.author,
      info.authorEmail,
      60
    );
    const fallbackAvatar = AvatarUtils.getAvatarFallback(info.author);

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Commit Details</title>
        <style>
            body {
                font-family: var(--vscode-font-family);
                font-size: var(--vscode-font-size);
                color: var(--vscode-foreground);
                background-color: var(--vscode-editor-background);
                padding: 20px;
                margin: 0;
                line-height: 1.6;
            }
            .header {
                display: flex;
                align-items: center;
                margin-bottom: 20px;
                padding-bottom: 15px;
                border-bottom: 1px solid var(--vscode-panel-border);
            }
            .avatar {
                width: 60px;
                height: 60px;
                border-radius: 50%;
                margin-right: 15px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            .commit-info {
                flex-grow: 1;
            }
            .author-name {
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 5px;
                color: var(--vscode-textLink-foreground);
            }
            .author-email {
                color: var(--vscode-descriptionForeground);
                margin-bottom: 8px;
                font-size: 14px;
            }
            .commit-hash {
                font-family: var(--vscode-editor-font-family);
                background-color: var(--vscode-textCodeBlock-background);
                padding: 6px 10px;
                border-radius: 4px;
                font-size: 12px;
                margin: 10px 0;
                display: inline-block;
                border: 1px solid var(--vscode-input-border);
            }
            .commit-link {
                color: var(--vscode-textLink-foreground);
                text-decoration: none;
                border-bottom: 1px solid var(--vscode-textLink-foreground);
                transition: opacity 0.2s;
            }
            .commit-link:hover {
                opacity: 0.8;
            }
            .github-hint {
                margin-left: 8px;
                font-size: 11px;
                color: var(--vscode-descriptionForeground);
            }
            .branch {
                background-color: var(--vscode-badge-background);
                color: var(--vscode-badge-foreground);
                padding: 3px 10px;
                border-radius: 12px;
                font-size: 11px;
                margin-left: 10px;
                font-weight: 500;
            }
            .commit-message {
                background-color: var(--vscode-textBlockQuote-background);
                border-left: 4px solid var(--vscode-textBlockQuote-border);
                padding: 15px 20px;
                margin: 20px 0;
                font-style: italic;
                border-radius: 0 4px 4px 0;
            }
            .commit-message h4 {
                margin: 0 0 10px 0;
                color: var(--vscode-textLink-foreground);
                font-style: normal;
            }
            .metadata {
                display: grid;
                grid-template-columns: 140px 1fr;
                gap: 12px 20px;
                margin-top: 25px;
                padding: 20px;
                background-color: var(--vscode-editor-background);
                border: 1px solid var(--vscode-panel-border);
                border-radius: 6px;
            }
            .label {
                font-weight: 600;
                color: var(--vscode-descriptionForeground);
                font-size: 13px;
            }
            .value {
                font-size: 14px;
                word-break: break-word;
            }
            .section-title {
                color: var(--vscode-textLink-foreground);
                font-size: 16px;
                font-weight: 600;
                margin: 25px 0 15px 0;
                border-bottom: 1px solid var(--vscode-panel-border);
                padding-bottom: 5px;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <img class="avatar"
                 src="${avatarUrl}"
                 alt="${info.author}'s avatar"
                 onerror="this.src='${fallbackAvatar}'">
            <div class="commit-info">
                <div class="author-name">${info.author}</div>
                <div class="author-email">${info.authorEmail}</div>
                <div>
                    ${
                      repoUrl
                        ? `<a href="${repoUrl}/commit/${info.commit}"
                          target="_blank"
                          class="commit-link commit-hash">
                          ${info.commit}
                       </a>
                       <span class="github-hint">🔗 View on GitHub</span>`
                        : `<span class="commit-hash">${info.commit}</span>`
                    }
                    <span class="branch">${info.branch}</span>
                </div>
            </div>
        </div>

        <div class="section-title">📝 Commit Message</div>
        <div class="commit-message">
            ${info.fullCommitMessage.replace(/\n/g, "<br>")}
        </div>

        <div class="section-title">📋 Details</div>
        <div class="metadata">
            <div class="label">Author Date:</div>
            <div class="value">${info.authorDate}</div>

            <div class="label">Committer:</div>
            <div class="value">${info.committerName} &lt;${
      info.committerEmail
    }&gt;</div>

            <div class="label">Relative Time:</div>
            <div class="value">${info.date}</div>

            <div class="label">Full Hash:</div>
            <div class="value">
                ${
                  repoUrl
                    ? `<a href="${repoUrl}/commit/${info.commit}"
                      target="_blank"
                      class="commit-link"
                      style="font-family: var(--vscode-editor-font-family); background-color: var(--vscode-textCodeBlock-background); padding: 2px 4px; border-radius: 3px;">
                      ${info.commit}
                   </a>
                   <span class="github-hint">🔗 View on GitHub</span>`
                    : `<code style="background-color: var(--vscode-textCodeBlock-background); padding: 2px 4px; border-radius: 3px;">${info.commit}</code>`
                }
            </div>

            ${
              repoUrl
                ? `<div class="label">Repository:</div>
               <div class="value">
                   <a href="${repoUrl}" target="_blank" class="commit-link">
                       ${repoUrl.replace("https://github.com/", "")}
                   </a>
               </div>`
                : ""
            }
        </div>

        <div style="margin-top: 20px; padding: 15px; background-color: var(--vscode-textBlockQuote-background); border-radius: 6px; text-align: center;">
            <span style="color: var(--vscode-descriptionForeground); font-size: 13px;">
                ${
                  repoUrl
                    ? "💡 Click any commit hash above to view the full commit on GitHub"
                    : "💡 Commit details and blame information"
                }
            </span>
        </div>
    </span>
</div>
    </body>
    </html>
    `;
  }

  static async showCommitDetails(commitHash: string, filePath: string) {
    try {
      const { GitUtils } = await import("../utils/gitUtils");
      const [detailedInfo, repoUrl] = await Promise.all([
        GitUtils.getDetailedCommitInfo(commitHash, filePath),
        GitUtils.getGitHubRepoUrl(filePath),
      ]);

      const panel = vscode.window.createWebviewPanel(
        "commitDetails",
        `Commit ${commitHash.substring(0, 8)}`,
        vscode.ViewColumn.Beside,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
        }
      );

      panel.webview.html = this.createCommitDetailsHtml(detailedInfo, repoUrl);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to load commit details: ${error}`);
    }
  }
}
