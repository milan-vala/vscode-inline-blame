import * as vscode from "vscode";
import { GitUtils } from "../utils/gitUtils";
import { AvatarUtils } from "../utils/avatarUtils";

export class GitHoverProvider implements vscode.HoverProvider {
  private isEnabled: boolean = true;

  async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position
  ): Promise<vscode.Hover | undefined> {
    if (!this.isEnabled) {
      return;
    }

    try {
      const blameData = await GitUtils.getGitBlameData(document.fileName);
      const lineNumber = position.line + 1;
      const blameInfo = blameData.get(lineNumber);

      if (!blameInfo) {
        return;
      }

      const detailedInfo = await GitUtils.getDetailedCommitInfo(
        blameInfo.commit,
        document.fileName
      );
      const markdown = this.createHoverMarkdown(detailedInfo);

      return new vscode.Hover(markdown);
    } catch (error) {
      return;
    }
  }

  private createHoverMarkdown(info: any): vscode.MarkdownString {
    const markdown = new vscode.MarkdownString();
    markdown.supportHtml = true;
    markdown.isTrusted = true;

    // Use our custom avatar system
    const avatarUrl = AvatarUtils.getAvatarUrl(info.author, info.authorEmail);
    const fallbackAvatar = AvatarUtils.getAvatarFallback(info.author);

    markdown.appendMarkdown(`
### Git Blame Information

<table style="border: none;">
  <tr>
    <td rowspan="4" style="border: none; padding-right: 10px;">
      <img src="${avatarUrl}" width="50" height="50" style="border-radius: 50%;" onerror="this.src='${fallbackAvatar}'">
    </td>
    <td style="border: none;"><strong>${info.author}</strong></td>
  </tr>
  <tr><td style="border: none;">${info.authorEmail}</td></tr>
  <tr><td style="border: none;">${info.date}</td></tr>
  <tr><td style="border: none;">Branch: <code>${info.branch}</code></td></tr>
</table>

**Commit:** \`${
      info.commit
    }\` [📋](command:vscode.env.clipboard.writeText?${encodeURIComponent(
      JSON.stringify(info.commit)
    )} "Copy full commit hash")

**Message:** ${GitUtils.truncateCommitMessage(info.fullCommitMessage, 100)}

---
*Hover over any line to see blame info • Click commit hash to copy*
    `);

    return markdown;
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }
}
