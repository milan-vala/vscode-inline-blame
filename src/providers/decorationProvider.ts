import * as vscode from "vscode";
import { BlameInfo, GitUtils } from "../utils/gitUtils";

export class DecorationProvider {
  private decorationType: vscode.TextEditorDecorationType;

  constructor() {
    this.decorationType = vscode.window.createTextEditorDecorationType({
      after: {
        color: new vscode.ThemeColor("editorCodeLens.foreground"),
        fontStyle: "italic",
        margin: "0 0 0 20px",
        textDecoration: "none",
      },
    });
  }

  async updateBlameAnnotations(
    editor: vscode.TextEditor,
    showOnlyCurrentLine: boolean = true
  ) {
    if (!editor || editor.document.uri.scheme !== "file") {
      return;
    }

    try {
      const blameData = await GitUtils.getGitBlameData(
        editor.document.fileName
      );

      let decorations: vscode.DecorationOptions[];
      if (showOnlyCurrentLine) {
        decorations = this.createCurrentLineDecoration(editor, blameData);
      } else {
        decorations = this.createAllLinesDecorations(editor, blameData);
      }

      editor.setDecorations(this.decorationType, decorations);
    } catch (error) {
      editor.setDecorations(this.decorationType, []);
    }
  }

  private createCurrentLineDecoration(
    editor: vscode.TextEditor,
    blameData: Map<number, BlameInfo>
  ): vscode.DecorationOptions[] {
    const decorations: vscode.DecorationOptions[] = [];
    const document = editor.document;
    const config = vscode.workspace.getConfiguration("gitBlameInline");

    const currentLine = editor.selection.active.line + 1;
    const blameInfo = blameData.get(currentLine);

    if (!blameInfo) {
      return decorations;
    }

    const line = document.lineAt(currentLine - 1);
    if (line.isEmptyOrWhitespace) {
      return decorations;
    }

    const blameText = this.formatBlameText(blameInfo, config);
    const range = new vscode.Range(
      currentLine - 1,
      line.range.end.character,
      currentLine - 1,
      line.range.end.character
    );

    decorations.push({
      range,
      renderOptions: {
        after: {
          contentText: ` ${blameText}`,
        },
      },
    });

    return decorations;
  }

  private createAllLinesDecorations(
    editor: vscode.TextEditor,
    blameData: Map<number, BlameInfo>
  ): vscode.DecorationOptions[] {
    const decorations: vscode.DecorationOptions[] = [];
    const document = editor.document;
    const config = vscode.workspace.getConfiguration("gitBlameInline");

    for (let lineNum = 1; lineNum <= document.lineCount; lineNum++) {
      const blameInfo = blameData.get(lineNum);
      if (!blameInfo) continue;

      const line = document.lineAt(lineNum - 1);
      if (line.isEmptyOrWhitespace) continue;

      const blameText = this.formatBlameText(blameInfo, config);
      const range = new vscode.Range(
        lineNum - 1,
        line.range.end.character,
        lineNum - 1,
        line.range.end.character
      );

      decorations.push({
        range,
        renderOptions: {
          after: {
            contentText: ` ${blameText}`,
          },
        },
      });
    }

    return decorations;
  }

  private formatBlameText(
    blameInfo: BlameInfo,
    config: vscode.WorkspaceConfiguration
  ): string {
    const showAuthor = config.get("showAuthor", true);
    const showDate = config.get("showDate", true);
    const showCommit = config.get("showCommit", false);
    const showCommitMessage = config.get("showCommitMessage", true);
    const maxAuthorLength = config.get("maxAuthorLength", 20);
    const maxCommitMessageLength = config.get("maxCommitMessageLength", 50);

    let blameText = "";

    if (showAuthor) {
      let author = blameInfo.author;
      if (author.length > maxAuthorLength) {
        author = author.substring(0, maxAuthorLength) + "...";
      }
      blameText += author;
    }

    if (showDate) {
      if (blameText) blameText += ", ";
      blameText += blameInfo.date;
    }

    if (showCommit) {
      if (blameText) blameText += " ";
      blameText += `(${blameInfo.commit})`;
    }

    if (showCommitMessage) {
      if (blameText) blameText += " • ";
      blameText += `"${GitUtils.truncateCommitMessage(
        blameInfo.commitMessage,
        maxCommitMessageLength
      )}"`;
    }

    return blameText;
  }

  clearDecorations(editor: vscode.TextEditor) {
    if (editor) {
      editor.setDecorations(this.decorationType, []);
    }
  }

  dispose() {
    this.decorationType.dispose();
  }
}
