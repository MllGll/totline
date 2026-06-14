# Product Constitution

## Product Overview

The product is a desktop-first persistent writing companion focused on frictionless thinking and uninterrupted writing.

It is NOT a traditional notes application, document editor, markdown editor, or workspace system.

The application behaves as a continuous persistent writing surface that is always available and instantly restorable.

The user should never think about:
- files
- saving
- folders
- documents
- organization
- exports

The application exists as a single continuous writing environment.

---

# Core Product Identity

The product should feel like:
- a floating writing companion
- a persistent scratchpad
- a lightweight technical utility
- ambient software
- a thought overlay

It should NOT feel like:
- a document editor
- a productivity suite
- a workspace manager
- a Notion clone
- a markdown application
- a block editor

---

# Core Philosophy

## The content is the priority

All interface decisions must prioritize:
- focus
- silence
- continuity
- minimal friction

## Persistence must feel invisible

The user should never manually save content.

Saving is automatic and transparent.

## The application must visually disappear

The UI should feel:
- lightweight
- calm
- minimal
- translucent
- non-intrusive

The interface exists only to support writing.

## No management-driven UX

The product must avoid introducing:
- file management
- workspace management
- organizational systems
- excessive controls
- feature-heavy interfaces

---

# Core Rules

## Single persistent document

The application contains exactly one persistent continuous document.

No multiple documents.
No pages.
No tabs.
No folders.
No workspaces.

Future evolution may introduce lightweight sections or tabs, but the single continuous document philosophy must remain dominant.

## Plain text first

The document source of truth must remain plain text.

```ts
content: string
```

## No rich text

The application must NOT support:
- rich text formatting
- custom fonts
- text styling
- embedded media
- tables
- markdown editor behavior
- block-based editing

## Syntax interpretation is allowed

The application may visually interpret specific text patterns while preserving plain text internally.

Example:

```txt
[ ] task
[x] completed task
```

Internally this remains plain text.
