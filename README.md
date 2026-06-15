<h1 align="center">TOTLINE</h1>

<div align="center">

[![Status](https://img.shields.io/badge/status-active-success.svg)]()
![Issues](https://img.shields.io/github/issues/MllGll/TOTLINE)
![Pull Requests](https://img.shields.io/github/issues-pr/MllGll/TOTLINE)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

</div>

## Table of Contents

- [Description](#description)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Build Artifacts](#build-artifacts)
- [Project Structure](#project-structure)
- [Tests](#tests)
- [Support](#support)
- [Authors](#authors)
- [License](#license)

## Description

TOTLINE is a desktop writing app built around a single persistent text surface. It is designed for quick notes, ongoing thoughts, lightweight tasks, and memory capture without files, folders, tabs, or document management. The app runs as a frameless floating panel, saves local state automatically, and restores writing context across sessions.

## Features

- Write in one continuous plain-text notebook.
- Keep notes locally with automatic persistence.
- Create interactive tasks with `[ ] task` and `[x] task`.
- Mark task text as completed when a checkbox is checked.
- Use `*text*` for bold text spans.
- Use `*line` to render an entire line in bold.
- Change editor zoom with `Ctrl + scroll`.
- Reset editor zoom with `Ctrl + 0`.
- Reveal a minimal header by hovering near the top edge.
- Open a centered help overlay from the header.
- Keep the window always on top with the pin control.
- Restore the previous window geometry when the app starts.
- Keep the app hidden on startup if it was previously hidden to the tray.

## Tech Stack

### Frontend

- React 19
- TypeScript
- Vite
- TailwindCSS
- CodeMirror

### Backend

- Tauri 2
- Rust
- SQLite via `rusqlite`
- `tauri-plugin-single-instance`

### Tooling / Infrastructure

- Vitest
- Testing Library
- Playwright
- Cargo
- npm

## Getting Started

### Prerequisites

- Node.js with npm
- Rust toolchain
- WebView2 runtime on Windows

### Installation

```bash
npm install
```

### Running the Project

Run the Vite frontend only:

```bash
npm run dev
```

Run the desktop app in Tauri development mode:

```bash
npm run tauri:dev
```

Build the frontend:

```bash
npm run build
```

Build the desktop app:

```bash
npm run tauri:build
```

## Available Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Starts the Vite development server. |
| `npm run build` | Runs TypeScript checks and builds the frontend. |
| `npm run preview` | Serves the production frontend build locally. |
| `npm run test` | Runs Vitest unit and integration tests. |
| `npm run test:watch` | Runs Vitest in watch mode. |
| `npm run test:e2e` | Runs Playwright end-to-end tests. |
| `npm run tauri` | Runs the Tauri CLI through the project wrapper. |
| `npm run tauri:dev` | Starts the Tauri desktop app in development mode. |
| `npm run tauri:build` | Builds the Tauri desktop app. |

## Build Artifacts

Running the desktop build creates both the release executable and installer packages:

```bash
npm run tauri:build
```

Windows output paths:

| Artifact | Path |
| --- | --- |
| Standalone executable | `src-tauri/target/release/totline.exe` |
| NSIS setup installer | `src-tauri/target/release/bundle/nsis/TOTLINE_0.1.0_x64-setup.exe` |
| MSI installer | `src-tauri/target/release/bundle/msi/TOTLINE_0.1.0_x64_en-US.msi` |

The exact installer filenames include the app version from `src-tauri/tauri.conf.json`.

## Project Structure

```text
.
|-- src/                    # React frontend
|   |-- components/         # Editor, header, help overlay, zoom HUD
|   |-- hooks/              # Shared React hooks
|   |-- lib/                # Editor syntax and Tauri bridge helpers
|   |-- App.tsx             # Main application shell
|   `-- index.css           # Global styling and glass UI tokens
|-- src-tauri/              # Tauri and Rust backend
|   |-- src/                # Commands, tray, window restore, SQLite persistence
|   |-- capabilities/       # Tauri permissions capability config
|   |-- permissions/        # Custom command permissions
|   `-- tests/              # Tauri contract tests
|-- tests/e2e/              # Playwright E2E and visual smoke tests
|-- scripts/                # Development wrappers
|-- playwright.config.ts    # Playwright configuration
|-- vitest.config.ts        # Vitest configuration
`-- package.json            # npm scripts and frontend dependencies
```

## Tests

Run frontend unit and integration tests:

```bash
npm run test
```

Run Playwright E2E tests:

```bash
npm run test:e2e
```

Run Rust and Tauri tests:

```bash
cd src-tauri
cargo test
```

Run Rust checks:

```bash
cd src-tauri
cargo check
```

The test suite covers:

- editor syntax parsing;
- checkbox and bold rendering behavior;
- keyboard shortcuts and zoom behavior;
- Tauri bridge calls;
- SQLite persistence;
- window geometry restoration;
- Tauri command, permission, and config contracts;
- E2E writing flows and visual smoke checks.

## Support

Use GitHub Issues first:

https://github.com/MllGll/TOTLINE/issues

Fallback contact:

Marcello Gallante  
Email: [marcellogallante@gmail.com](mailto:marcellogallante@gmail.com)

## Authors

Marcello Gallante

- GitHub: https://github.com/MllGll

## License

This project is licensed under the [MIT License](./LICENSE).
