# Implementation Roadmap

# Phase 1 — Application Shell

Goals:
- validate product feeling
- validate window behavior
- validate desktop interaction model

Implement:
- Tauri app shell
- frameless window
- transparency
- blur effects
- always-on-top
- tray integration
- ESC minimize behavior
- close-to-tray behavior
- single instance lock
- smooth resize behavior
- header reveal interaction
- window persistence

Do NOT implement advanced editor behavior yet.

---

# Phase 2 — Core Editor

Implement:
- textarea-based editor
- autosave
- SQLite persistence
- restore system
- cursor persistence
- selection persistence
- scroll persistence
- zoom persistence
- placeholder
- smooth scrolling
- minimal scrollbar

Goal:
validate writing experience.

---

# Phase 3 — Visual Refinement

Implement:
- refined glass effects
- shadow tuning
- typography tuning
- selection styling
- hover behaviors
- transitions
- zoom HUD
- theme switching

Goal:
polish interaction feeling.

---

# Phase 4 — Syntax Interpretation

Implement:
- checkbox rendering
- checkbox interaction
- lightweight syntax interpretation

Maintain:

```ts
content: string
```

as the internal document model.

---

# Phase 5 — Stability

Focus on:
- startup reliability
- persistence reliability
- tray edge cases
- focus management
- memory usage
- resize edge cases
- large document performance

---

# Explicit Technical Direction

Start with:

```html
<textarea>
```

Do NOT prematurely build:
- custom editors
- block systems
- rich text engines

Only evolve beyond textarea if genuinely necessary.
