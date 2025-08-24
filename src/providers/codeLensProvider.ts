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
    const trimmedLine = line.trim();

    // Only show for TypeScript interfaces, types, enums, and classes
    const patterns = [
      /^(export\s+)?interface\s+\w+/, // interface declarations
      /^(export\s+)?type\s+\w+\s*=/, // type alias declarations
      /^(export\s+)?enum\s+\w+/, // enum declarations
      /^(export\s+)?(abstract\s+)?class\s+\w+/, // class declarations
      /^(export\s+)?default\s+(class|interface)/, // default exports
    ];

    // Exclude regular const, let, var, and function assignments
    const excludePatterns = [
      /^(export\s+)?const\s+\w+\s*[:=]/, // const declarations
      /^(export\s+)?let\s+\w+\s*[:=]/, // let declarations
      /^(export\s+)?var\s+\w+\s*[:=]/, // var declarations
      /^(export\s+)?function\s+\w+/, // function declarations
      /^import\s+.*from/, // import statements
    ];

    // First check if it should be excluded
    if (excludePatterns.some((pattern) => pattern.test(trimmedLine))) {
      return false;
    }

    // Then check if it matches our include patterns
    return patterns.some((pattern) => pattern.test(trimmedLine));
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }
}
