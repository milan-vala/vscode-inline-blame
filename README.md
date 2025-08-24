# Git Blame Inline

A lightweight VS Code extension that shows Git blame information directly inline with your code - no clutter, just the essential author and date info you need.

![Git Blame Inline Demo](https://via.placeholder.com/800x400/1e1e1e/ffffff?text=Demo+Screenshot+Here)

## ✨ Features

- **Inline Blame Annotations**: See who changed each line and when, right next to your code
- **Lightweight & Fast**: Minimal overhead with smart caching
- **Clean Design**: Subtle annotations that don't interfere with your coding
- **Highly Configurable**: Show/hide author, date, or commit hash as needed
- **Smart Date Formatting**: Shows relative dates (e.g., "2 days ago", "last week")
- **Keyboard Shortcuts**: Quick toggle with `Cmd+Shift+B` (Mac) or `Ctrl+Shift+B` (Windows/Linux)

## 🚀 Quick Start

1. Install the extension
2. Open any Git repository
3. Git blame annotations appear automatically
4. Use `Cmd+Shift+B` to toggle on/off

## ⚙️ Configuration

Customize the extension through VS Code settings:

```json
{
  "gitBlameInline.showAuthor": true,
  "gitBlameInline.showDate": true,
  "gitBlameInline.showCommit": false,
  "gitBlameInline.maxAuthorLength": 20,
  "gitBlameInline.enabled": true
}
```

### Settings Details

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `showAuthor` | boolean | `true` | Show author name in annotations |
| `showDate` | boolean | `true` | Show commit date in annotations |
| `showCommit` | boolean | `false` | Show short commit hash |
| `maxAuthorLength` | number | `20` | Maximum author name length (truncated with ...) |
| `enabled` | boolean | `true` | Enable annotations by default |

## 🎯 Commands

- **Git Blame Inline: Toggle** - Toggle blame annotations on/off
- **Git Blame Inline: Enable** - Enable blame annotations
- **Git Blame Inline: Disable** - Disable blame annotations

Access via Command Palette (`Cmd+Shift+P`) or right-click context menu.

## 🔧 Requirements

- VS Code 1.74.0 or higher
- Git repository (extension automatically detects non-git files)

## 🚫 What This Extension Doesn't Do

Unlike heavy-featured Git extensions, this extension focuses solely on inline blame annotations. It doesn't include:
- Git commit history views
- File diffs
- Branch management
- Repository status
- Code lens features
- Hover tooltips with detailed commit info

This keeps it lightning-fast and distraction-free.

## 🆚 Why Another Git Blame Extension?

While GitLens is excellent, it comes with many features you might not need. If you only want inline blame annotations without the extra features, this extension provides:

- **Minimal footprint** - Only does blame annotations
- **Better performance** - No unused features running in background
- **Cleaner interface** - No additional UI elements
- **Faster startup** - Loads quickly without feature bloat

## 🐛 Known Issues

- Large files (1000+ lines) may take a moment to load blame data
- Binary files are automatically skipped
- Requires file to be committed to Git (uncommitted changes won't show blame)

## 📝 Release Notes

### 0.1.0
- Initial release
- Inline Git blame annotations
- Configurable display options
- Keyboard shortcuts and context menu integration
- Smart date formatting
- Performance optimizations with caching

## 🤝 Contributing

Found a bug or want to contribute?

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⭐ Support

If you find this extension helpful, please:
- ⭐ Star the repository
- 📝 Leave a review on the VS Code Marketplace
- 🐛 Report issues on GitHub
- 💡 Suggest new features

---

**Happy coding!** 🚀

Made with ❤️ for developers who want clean, fast Git blame annotations.