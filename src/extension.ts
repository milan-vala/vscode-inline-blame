import * as vscode from "vscode";
import * as cp from "child_process";
import * as path from "path";

interface BlameInfo {
  author: string;
  date: string;
  commit: string;
}

export function activate(context: vscode.ExtensionContext) {
  const blameProvider = new GitBlameProvider();

  const toggleCommand = vscode.commands.registerCommand(
    "gitBlameInline.toggle",
    () => {
      blameProvider.toggle();
    }
  );

  const enableCommand = vscode.commands.registerCommand(
    "gitBlameInline.enable",
    () => {
      blameProvider.enable();
    }
  );

  const disableCommand = vscode.commands.registerCommand(
    "gitBlameInline.disable",
    () => {
      blameProvider.disable();
    }
  );

  context.subscriptions.push(
    toggleCommand,
    enableCommand,
    disableCommand,
    blameProvider
  );
}

class GitBlameProvider implements vscode.Disposable {
  private decorationType: vscode.TextEditorDecorationType;
  private isEnabled: boolean = true;
  private disposables: vscode.Disposable[] = [];
  private blameCache = new Map<string, Map<number, BlameInfo>>();

  constructor() {
    this.decorationType = vscode.window.createTextEditorDecorationType({
      after: {
        color: new vscode.ThemeColor("editorCodeLens.foreground"),
        fontStyle: "italic",
        margin: "0 0 0 20px",
        textDecoration: "none",
      },
    });

    this.disposables.push(
      vscode.window.onDidChangeActiveTextEditor(
        this.onActiveEditorChanged,
        this
      ),
      vscode.workspace.onDidChangeTextDocument(this.onDocumentChanged, this),
      vscode.workspace.onDidSaveTextDocument(this.onDocumentSaved, this),
      vscode.window.onDidChangeTextEditorSelection(
        this.onSelectionChanged,
        this
      )
    );

    this.updateBlameAnnotations();
  }

  private onActiveEditorChanged() {
    this.updateBlameAnnotations();
  }

  private onDocumentChanged(event: vscode.TextDocumentChangeEvent) {
    const filePath = event.document.fileName;
    this.blameCache.delete(filePath);

    const config = vscode.workspace.getConfiguration("gitBlameInline");
    const showOnlyCurrentLine = config.get("showOnlyCurrentLine", true);

    if (!showOnlyCurrentLine) {
      setTimeout(() => this.updateBlameAnnotations(), 300);
    }
  }

  private onDocumentSaved(document: vscode.TextDocument) {
    this.blameCache.delete(document.fileName);
    this.updateBlameAnnotations();
  }

  private onSelectionChanged() {
    this.updateBlameAnnotations();
  }

  private async updateBlameAnnotations() {
    const editor = vscode.window.activeTextEditor;
    if (!editor || !this.isEnabled) {
      return;
    }

    const document = editor.document;
    const filePath = document.fileName;

    if (document.uri.scheme !== "file") {
      return;
    }

    try {
      const blameData = await this.getGitBlameData(filePath);
      const decorations = this.createDecorations(editor, blameData);
      editor.setDecorations(this.decorationType, decorations);
    } catch (error) {
      editor.setDecorations(this.decorationType, []);
    }
  }

  private async getGitBlameData(
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

  private parseGitBlameOutput(output: string): Map<number, BlameInfo> {
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
      } else if (line.startsWith("author-time ")) {
        const timestamp = parseInt(line.substring(12));
        const date = new Date(timestamp * 1000);
        const commitData = commits.get(currentCommit);
        if (commitData) {
          commitData.date = this.formatDate(date);
        }
      } else if (line.startsWith("\t")) {
        const commitData = commits.get(currentCommit);
        if (commitData && commitData.author && commitData.date) {
          blameData.set(currentLineNum, {
            author: commitData.author,
            date: commitData.date,
            commit: currentCommit.substring(0, 8),
          });
        }
      }
    }

    return blameData;
  }

  private formatDate(date: Date): string {
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

  private createDecorations(
    editor: vscode.TextEditor,
    blameData: Map<number, BlameInfo>
  ): vscode.DecorationOptions[] {
    const decorations: vscode.DecorationOptions[] = [];
    const document = editor.document;

    const config = vscode.workspace.getConfiguration("gitBlameInline");
    const showAuthor = config.get("showAuthor", true);
    const showDate = config.get("showDate", true);
    const showCommit = config.get("showCommit", false);
    const maxAuthorLength = config.get("maxAuthorLength", 20);
    const showOnlyCurrentLine = config.get("showOnlyCurrentLine", true);

    let linesToProcess: number[] = [];

    if (showOnlyCurrentLine) {
      const currentLine = editor.selection.active.line + 1;
      linesToProcess = [currentLine];
    } else {
      linesToProcess = Array.from(
        { length: document.lineCount },
        (_, i) => i + 1
      );
    }

    for (const lineNum of linesToProcess) {
      const blameInfo = blameData.get(lineNum);
      if (!blameInfo) continue;

      const line = document.lineAt(lineNum - 1);
      if (line.isEmptyOrWhitespace) continue;

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

  public toggle() {
    this.isEnabled = !this.isEnabled;
    if (this.isEnabled) {
      this.updateBlameAnnotations();
      vscode.window.showInformationMessage("Git Blame Inline: Enabled");
    } else {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        editor.setDecorations(this.decorationType, []);
      }
      vscode.window.showInformationMessage("Git Blame Inline: Disabled");
    }
  }

  public enable() {
    this.isEnabled = true;
    this.updateBlameAnnotations();
    vscode.window.showInformationMessage("Git Blame Inline: Enabled");
  }

  public disable() {
    this.isEnabled = false;
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      editor.setDecorations(this.decorationType, []);
    }
    vscode.window.showInformationMessage("Git Blame Inline: Disabled");
  }

  dispose() {
    this.decorationType.dispose();
    this.disposables.forEach((d) => d.dispose());
  }
}

export function deactivate() {}
