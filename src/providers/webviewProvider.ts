import * as vscode from "vscode";
import { DetailedCommitInfo } from "../utils/gitUtils";

export class WebviewProvider {
  static createCommitDetailsHtml(info: DetailedCommitInfo): string {
    const avatarUrl = `https://github.com/${info.author}.png?size=60`;
    const fallbackAvatar = `https://via.placeholder.com/60/333333/ffffff?text=${info.author
      .charAt(0)
      .toUpperCase()}`;

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
                cursor: pointer;
                border: 1px solid var(--vscode-input-border);
                transition: background-color 0.2s;
            }
            .commit-hash:hover {
                background-color: var(--vscode-button-secondaryHoverBackground);
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
            .copy-hint {
                font-size: 12px;
                color: var(--vscode-descriptionForeground);
                margin-top: 10px;
                font-style: italic;
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
                    <span class="commit-hash"
                          title="Click to copy full commit hash"
                          onclick="navigator.clipboard.writeText('${
                            info.commit
                          }')">${info.commit}</span>
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
                <code style="background-color: var(--vscode-textCodeBlock-background); padding: 2px 4px; border-radius: 3px;">${
                  info.commit
                }</code>
            </div>
        </div>

        <div class="copy-hint">
            💡 Click on the commit hash above to copy it to your clipboard
        </div>

        <script>
            // Add click-to-copy functionality
            document.querySelectorAll('.commit-hash').forEach(element => {
                element.addEventListener('click', () => {
                    const hash = element.textContent;
                    navigator.clipboard.writeText(hash).then(() => {
                        element.style.backgroundColor = 'var(--vscode-button-background)';
                        element.textContent = 'Copied!';
                        setTimeout(() => {
                            element.textContent = hash;
                            element.style.backgroundColor = 'var(--vscode-textCodeBlock-background)';
                        }, 1000);
                    });
                });
            });
        </script>
    </body>
    </html>
    `;
  }

  static async showCommitDetails(commitHash: string, filePath: string) {
    try {
      const { GitUtils } = await import("../utils/gitUtils");
      const detailedInfo = await GitUtils.getDetailedCommitInfo(
        commitHash,
        filePath
      );

      const panel = vscode.window.createWebviewPanel(
        "commitDetails",
        `Commit ${commitHash.substring(0, 8)}`,
        vscode.ViewColumn.Beside,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
        }
      );

      panel.webview.html = this.createCommitDetailsHtml(detailedInfo);

      // Handle webview messages if needed
      panel.webview.onDidReceiveMessage((message) => {
        switch (message.command) {
          case "copyHash":
            vscode.env.clipboard.writeText(message.hash);
            vscode.window.showInformationMessage(
              "Commit hash copied to clipboard"
            );
            break;
        }
      });
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to load commit details: ${error}`);
    }
  }
}
