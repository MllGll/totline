# TOTLINE

Desktop writing companion: one continuous, persistent text surface with invisible autosave.

## Stack

- Tauri 2: desktop runtime
- React + TypeScript + Vite: frontend
- TailwindCSS: styling
- SQLite: local persistence

## Development

Prerequisites: Node.js 18+, Rust stable, Visual Studio Build Tools with C++, and WebView2 on Windows.

```bash
npm install
npm run tauri:dev
```

## Production

```bash
npm run tauri:build
```

## Behavior

| Action | Behavior |
| --- | --- |
| Esc | Minimizes the window |
| Header hide button | Minimizes the window |
| Window close event | Hides the window to the system tray |
| Tray -> Show TOTLINE | Restores and focuses the window |
| Tray -> Quit | Saves state and exits |
| Ctrl + scroll | Changes editor zoom |
| Ctrl + 0 | Resets editor zoom to 100% |
| Hover near the top edge | Reveals the tiny header |

## Startup Preference

If the app was hidden to the tray through the window close event, it stays hidden on the next launch until restored from the tray.

## Plain Text Syntax

TOTLINE keeps the document as plain text and renders a few lightweight affordances:

| Syntax | Rendering |
| --- | --- |
| `[ ] task` | Interactive unchecked checkbox |
| `[x] task` | Interactive checked checkbox |
| `*text*` | Bold text segment |
| `*line` | Bold line |

## Philosophy

One endless notebook. No files, tabs, dashboards, or document management. Just a calm floating surface for memory and writing.
