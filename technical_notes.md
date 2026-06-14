# Technical Notes

# Recommended Stack

## Desktop Runtime
- Tauri

## Frontend
- React
- TypeScript
- Vite
- TailwindCSS

## Persistence
- SQLite

---

# Architectural Direction

The application should remain:
- monolithic
- modular internally
- local-first
- single-process oriented

Avoid:
- microservices
- remote backend dependency
- unnecessary abstraction layers

---

# Persistence Model

The source of truth should remain:

```ts
content: string
```

The database exists only for persistence and settings.

---

# Persisted Data

Persist:
- document content
- cursor position
- selection range
- scroll position
- zoom level
- window size
- window position
- theme preference
- startup preference

---

# Autosave Strategy

Use debounced autosave.

Recommended debounce:
- ~500ms

Reason:
- instant perceived saving
- reduced unnecessary writes
- simpler persistence stability

---

# Editor Strategy

Initial implementation should use:

```html
<textarea>
```

Reasons:
- stability
- performance
- native behavior
- lower complexity
- easier persistence
- easier maintenance

Avoid:
- contenteditable
- ProseMirror
- Slate
- Lexical
- TipTap

unless future requirements truly demand them.

---

# Blur Strategy

Prefer real operating system blur implementations when available.

Especially on Windows:
- Acrylic
- Mica-like effects

Avoid fake CSS-only glass implementations if native blur is possible.

---

# Performance Philosophy

The application should prioritize:
- responsiveness
- startup speed
- low memory usage
- lightweight feeling

Over:
- excessive abstraction
- complex rendering systems
- feature-heavy infrastructure
