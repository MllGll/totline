# AGENT.md

Operational rules for AI-assisted development in TOTLINE.

This document is the local contract for any AI agent working in this repository. It defines how changes should be specified, implemented, tested, documented, and reported so the product stays coherent as it evolves.

## Core Principles

1. **Specification before implementation**
   - Start from the intended behavior, not from the easiest code change.
   - Treat visible product promises, requirements, help text, README content, and TODO items as specifications.
   - If a behavior is ambiguous, inspect the existing code and tests before deciding.

2. **Behavior over implementation detail**
   - Describe user-facing behavior in concrete terms.
   - Prefer examples that can become tests.
   - For user-visible work, think in BDD terms: given the current state, when the user acts, then the product should respond in a specific way.

3. **Context-grounded changes**
   - Read the relevant local files before editing.
   - Follow existing architecture, naming, visual language, and test style.
   - Do not invent APIs, patterns, or product behavior without verifying the local context.

4. **Coherence is mandatory**
   - Any feature shown in the UI, help overlay, README, TODO, tests, or comments must have a corresponding implementation.
   - Any implemented behavior that users are expected to discover must be documented where appropriate.
   - Remove or update stale promises immediately.

5. **Tests are part of the change**
   - Every new feature or bug fix must add or update automated tests when technically feasible.
   - Test the behavior at the lowest useful level and add broader coverage when the risk justifies it.
   - A change is not complete until the relevant automated tests have been run.

## Language Policy

All repository content must be written in English.

This includes:

- source code names: variables, functions, classes, types, constants, file-level comments;
- UI copy, labels, tooltips, accessibility labels, placeholders, and menu items;
- tests, test names, fixtures, and assertions;
- documentation, TODO items, release notes, and agent instructions.

Exceptions are allowed only when a non-English string is explicitly part of a user-facing localization feature or test fixture.

## Required Workflow

Follow this flow for every non-trivial change.

### 1. Discover

- Inspect the relevant files before editing.
- Identify the current behavior, the intended behavior, and the affected surfaces.
- Check whether README, TODO, help text, tests, Tauri config, or permissions mention the behavior.

### 2. Specify

Before implementation, be clear about:

- the user-visible behavior;
- the persistence or state implications;
- expected keyboard shortcuts, labels, and accessibility names;
- failure or fallback behavior;
- test coverage required.

Use BDD-style thinking for behavioral changes:

```text
Given <initial state>
When <user action or system event>
Then <observable result>
```

### 3. Plan

Keep plans small and tied to files or behaviors. Prefer incremental work:

- update implementation;
- update tests;
- update documentation;
- run validation.

### 4. Implement

- Keep edits scoped to the requested behavior.
- Preserve existing product aesthetics and interaction patterns.
- Do not refactor unrelated code unless required for correctness or testability.
- Use structured APIs and typed contracts instead of ad hoc parsing when practical.

### 5. Verify

Always run automated tests after any change made by an AI agent in the IDE.

Use the smallest sufficient validation set, but include broader suites when touching shared behavior:

- frontend unit/integration: `npm.cmd test`;
- frontend production build: `npm.cmd run build`;
- E2E behavior/visual smoke: `npm.cmd run test:e2e`;
- Rust/Tauri checks: `cargo check`;
- Rust/Tauri tests: `cargo test`.

When changing these areas, run the related suites:

| Area changed | Required validation |
| --- | --- |
| Editor syntax, checkbox behavior, bold rendering, caret, selection, zoom | `npm.cmd test`, `npm.cmd run test:e2e`, `npm.cmd run build` |
| Help overlay, header, UI labels, visual shell | `npm.cmd run test:e2e`, `npm.cmd run build` |
| Tauri commands, permissions, tray, window config | `cargo test`, `cargo check` |
| Persistence, SQLite schema, startup state, window geometry | `cargo test`, `cargo check`, plus relevant E2E if frontend behavior changes |
| Documentation-only changes | run at least `npm.cmd test` and any suite directly affected by documented behavior |

If a test cannot be run, state why and what risk remains.

## Documentation Rules

1. Always update `TODO.md` when applicable.
2. Always update `README.md` when applicable.
3. Keep documentation aligned with actual product behavior.
4. Do not document planned behavior as if it already exists.
5. Keep help overlay instructions synchronized with implemented shortcuts and syntax.

## Test Design Rules

- Prefer behavior-focused tests over implementation snapshots.
- Unit-test pure logic, especially parsing, state normalization, and geometry.
- Integration-test bridges and contracts, especially Tauri command names, permissions, and config.
- E2E-test user workflows and visual smoke behavior.
- Add regression tests for every bug that escaped previous coverage.
- Tests should fail for meaningful product regressions, not for harmless timing or subpixel differences.

## AI Agent Safety Rules

- Never delete, overwrite, or revert user changes unless explicitly asked.
- Do not run destructive commands without explicit approval.
- Do not hide failed validation. Report failures clearly and fix them when within scope.
- Do not claim a behavior is supported until it is implemented and tested.
- Do not leave generated artifacts or reports tracked unless they are intended project assets.
- Prefer small, reviewable changes over broad rewrites.

## Definition of Done

A change is done only when:

- the implementation matches the requested behavior;
- visible UI, accessibility labels, README, TODO, and help text are coherent;
- relevant automated tests were added or updated;
- relevant validation commands passed;
- remaining risks or skipped checks are explicitly reported.

## Reporting Back

Final responses should include:

- what changed;
- what was validated;
- any documentation or TODO updates;
- any known limitation or skipped check.

Keep the response concise and specific.
