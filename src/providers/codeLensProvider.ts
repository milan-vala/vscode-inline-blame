import * as vscode from "vscode";
import { GitUtils } from "../utils/gitUtils";

export class GitCodeLensProvider implements vscode.CodeLensProvider {
  private isEnabled: boolean = true;

  async provideCodeLenses(
    document: vscode.TextDocument
  ): Promise<vscode.CodeLens[]> {
    const config = vscode.workspace.getConfiguration("gitBlameInline");
    const showCodeLens = config.get("showCodeLens", true);

    if (!showCodeLens || !this.isEnabled) {
      return [];
    }

    const codeLenses: vscode.CodeLens[] = [];
    const text = document.getText();
    const lines = text.split("\n");

    try {
      const blameData = await GitUtils.getGitBlameData(document.fileName);

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (this.shouldShowCodeLens(line)) {
          const blameInfo = blameData.get(i + 1);
          if (blameInfo) {
            const range = new vscode.Range(i, 0, i, 0);
            const command: vscode.Command = {
              title: `${blameInfo.author}, ${
                blameInfo.date
              } • "${GitUtils.truncateCommitMessage(blameInfo.commitMessage)}"`,
              command: "gitBlameInline.showCommitDetails",
              arguments: [blameInfo.commit, document.fileName],
            };
            codeLenses.push(new vscode.CodeLens(range, command));
          }
        }
      }
    } catch (error) {
      // Silently fail for non-git files
    }

    return codeLenses;
  }

  private shouldShowCodeLens(line: string): boolean {
    const patterns = [
      /^(export\s+)?(interface|class|type|enum)\s+\w+/,
      /^(export\s+)?(function|const|let|var)\s+\w+/,
      /^(export\s+)?(abstract\s+)?class\s+\w+/,
      /^(export\s+)?default\s+(class|function)/,
      /^import\s+.*from/,
      /^\/\*\*/, // JSDoc comments
    ];

    return patterns.some((pattern) => pattern.test(line));
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }
}
