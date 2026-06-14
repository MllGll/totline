# TOTLINE

Companheiro de escrita persistente para desktop — superfície contínua, sem arquivos, com autosave invisível.

## Stack

- **Tauri 2** — runtime desktop
- **React + TypeScript + Vite** — frontend
- **TailwindCSS** — estilos
- **SQLite** — persistência local

## Desenvolvimento

Pré-requisitos: Node.js 18+, Rust (stable), **Visual Studio Build Tools** (C++), WebView2 no Windows.

```bash
npm install
npm run tauri dev
```

> **Nota Windows:** se `link.exe` não for encontrado, instale [Build Tools for Visual Studio](https://visualstudio.microsoft.com/visual-cpp-build-tools/) com a carga "Desktop development with C++".

## Produção

```bash
npm run tauri build
```

## Atalhos e comportamento

| Ação | Comportamento |
|------|----------------|
| **Esc** | Minimiza a janela |
| **Fechar (×)** | Oculta para a bandeja do sistema |
| **Ctrl + scroll** | Zoom do editor |
| **Ctrl + 0** | Restaura zoom para 100% |
| **Topo da janela (hover)** | Revela o header com controles |
| **Bandeja** | Clique esquerdo mostra; menu: Mostrar / Sair |

## Checkboxes

Linhas no formato `[ ] tarefa` ou `- [x] concluída` recebem checkboxes interativos. O conteúdo permanece texto puro internamente.

## Filosofia

Um único documento contínuo. Sem pastas, abas ou exportação. Persistência automática a cada ~500ms.
