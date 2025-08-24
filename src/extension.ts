import * as vscode from "vscode";
import { DecorationProvider } from "./providers/decorationProvider";
import { GitCodeLensProvider } from "./providers/codeLensProvider";
import { GitHoverProvider } from "./providers/hoverProvider";
import { WebviewProvider } from "./providers/webviewProvider";
import { GitUtils } from "./utils/gitUtils";

export function activate(context: vscode.ExtensionContext) {
  const gitBlameManager = new GitBlameManager();

  // Register commands
  const toggleCommand = vscode.commands.registerCommand(
    "gitBlameInline.toggle",
    () => gitBlameManager.toggle()
  );

  const enableCommand = vscode.commands.registerCommand(
    "gitBlameInline.enable",
    () => gitBlameManager.enable()
  );

  const disableCommand = vscode.commands.registerCommand(
    "gitBlameInline.disable",
    () => gitBlameManager.disable()
  );

  const showCommitDetailsCommand = vscode.commands.registerCommand(
    "gitBlameInline.showCommitDetails",
    (commitHash: string, filePath: string) => {
      WebviewProvider.showCommitDetails(commitHash, filePath);
    }
  );

  context.subscriptions.push(
    toggleCommand,
    enableCommand,
    disableCommand,
    showCommitDetailsCommand,
    gitBlameManager
  );
}

class GitBlameManager implements vscode.Disposable {
  private decorationProvider: DecorationProvider;
  private codeLensProvider: GitCodeLensProvider;
  private hoverProvider: GitHoverProvider;
  private isEnabled: boolean = true;
  private disposables: vscode.Disposable[] = [];

  constructor() {
    this.decorationProvider = new DecorationProvider();
    this.codeLensProvider = new GitCodeLensProvider();
    this.hoverProvider = new GitHoverProvider();

    // Register providers
    this.disposables.push(
      vscode.languages.registerCodeLensProvider(
        { scheme: "file" },
        this.codeLensProvider
      ),
      vscode.languages.registerHoverProvider(
        { scheme: "file" },
        this.hoverProvider
      )
    );

    // Register event listeners
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
  }

  private onActiveEditorChanged(editor: vscode.TextEditor | undefined) {
    if (editor) {
      this.decorationProvider.clearDecorations(editor);
    }
  }

  private onDocumentChanged(event: vscode.TextDocumentChangeEvent) {
    GitUtils.clearCache(event.document.fileName);

    const editor = vscode.window.activeTextEditor;
    if (editor && editor.document === event.document) {
      this.decorationProvider.clearDecorations(editor);
    }
  }

  private onDocumentSaved(document: vscode.TextDocument) {
    GitUtils.clearCache(document.fileName);

    const editor = vscode.window.activeTextEditor;
    if (editor && editor.document === document) {
      this.decorationProvider.clearDecorations(editor);
    }
  }

  private onSelectionChanged() {
    this.updateBlameAnnotations();
  }

  private async updateBlameAnnotations() {
    if (!this.isEnabled) {
      return;
    }

    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    const config = vscode.workspace.getConfiguration("gitBlameInline");
    const showOnlyCurrentLine = config.get("showOnlyCurrentLine", true);

    await this.decorationProvider.updateBlameAnnotations(
      editor,
      showOnlyCurrentLine
    );
  }

  public toggle() {
    this.isEnabled = !this.isEnabled;
    this.setEnabled(this.isEnabled);

    const message = this.isEnabled
      ? "Git Blame Inline: Enabled"
      : "Git Blame Inline: Disabled";
    vscode.window.showInformationMessage(message);
  }

  public enable() {
    this.isEnabled = true;
    this.setEnabled(true);
    vscode.window.showInformationMessage("Git Blame Inline: Enabled");
  }

  public disable() {
    this.isEnabled = false;
    this.setEnabled(false);
    vscode.window.showInformationMessage("Git Blame Inline: Disabled");
  }

  private setEnabled(enabled: boolean) {
    this.codeLensProvider.setEnabled(enabled);
    this.hoverProvider.setEnabled(enabled);

    if (enabled) {
      this.updateBlameAnnotations();
    } else {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        this.decorationProvider.clearDecorations(editor);
      }
    }
  }

  dispose() {
    this.decorationProvider.dispose();
    this.disposables.forEach((d) => d.dispose());
  }
}

export function deactivate() {
  GitUtils.clearCache();
}
