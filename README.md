# TinyToDo

[![CI](https://github.com/ueokande/tinytodo/actions/workflows/ci.yml/badge.svg)](https://github.com/ueokande/tinytodo/actions/workflows/ci.yml)

A minimal, offline-first to-do app for shopping lists and quick notes. Built with React, TypeScript, and CSS Modules, with all list data stored on your device.

## Features

- Title-only tasks, organized into multiple boards.
- Swipe right or tap the circle to complete a task.
- Tap a task title to edit it, or long-press and drag to reorder tasks within their active or completed group.
- A bottom input bar for quick, one-handed entry.
- Undo task completion and clearing completed tasks.
- Create, rename, archive, restore, and delete boards; remember the last active board you opened.
- Edit mode with drag handles for task and board ordering (including keyboard controls), task renaming, and individual task deletion.
- Installable PWA with offline access after the first online visit.
- Short animations that respect reduced-motion preferences.
- No accounts, analytics, external fonts, or application backend.

## Getting started

Requires **Node.js 22.18+** (24 recommended) and **pnpm 11.25.0**, pinned in `package.json`.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open the URL printed by Vite. Service workers are enabled only in production builds.

## Development

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the development server |
| `pnpm check` | Check lint rules and formatting with Biome |
| `pnpm format` | Apply Biome fixes and formatting |
| `pnpm typecheck` | Run TypeScript in strict mode |
| `pnpm test` | Run Vitest unit and React Hook tests |
| `pnpm test:watch` | Run Vitest in watch mode |
| `pnpm test:e2e` | Build and run Playwright browser tests |
| `pnpm build` | Type-check and generate `dist/` |
| `pnpm preview` | Serve the production build locally |

Install Chromium before running browser tests:

```sh
pnpm exec playwright install --with-deps chromium
pnpm test:e2e
```

To use an existing Chromium installation, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to its executable path.

Vitest covers domain operations, storage validation, data migration, and React state updates under Strict Mode. Playwright covers task and board operations, persistence, swipe gestures, modal animations, keyboard viewport changes, and offline behavior.

## Install on Android

Open the app in Chrome, then choose **Install app** or **Add to Home screen** from the browser menu. The app needs an online visit to cache its files before it can work offline.

Deployment requires HTTPS static hosting. No application server or database is needed.

## Deployment

```sh
pnpm build
```

Upload the contents of `dist/` to your static host. For a site hosted under a subdirectory, set a base path with a trailing slash:

```sh
VITE_BASE_PATH=/tinytodo/ pnpm build
```

The asset URLs, PWA manifest, service worker scope, and offline cache support both root and subdirectory deployments.

### GitHub Pages

The [GitHub Actions workflow](.github/workflows/ci.yml) runs lint, Vitest, type checks, a production build, and Playwright on pushes and pull requests. Browser tests use `/tinytodo/` to exercise the Pages deployment path. Failure reports and traces are retained for seven days.

Pushes to `master`, including merged pull requests, deploy to Pages only after all checks pass. The deployment base path is read from the Pages configuration. The workflow can also be run manually on `master`.

For initial setup, select **Settings → Pages → Build and deployment → Source → GitHub Actions**. No personal access token is required.

### Workflow dependency lockfile

GitHub Actions dependencies are pinned in `.github/workflows/actions.lock` using GitHub's official lockfile format. It records commit SHAs, repository and owner identities, and transitive composite-action dependencies. Workflow files use exact release tags for readability; the lockfile fixes the commits that execute.

GitHub automatically validates onboarded dependencies against the lockfile when workflows run, including locked commits and repository identities. No separate verification job is required.

To update workflows or refresh action pins, use an authenticated GitHub CLI:

```sh
gh extension install github/gh-actions-lock --pin v0.4.1
gh actions-lock
gh actions-lock --verify
git add .github/workflows/
```

Use `gh actions-lock --relock` to intentionally advance existing pins after reviewing upstream changes. Commit workflow and lockfile updates together. `gh actions-lock --verify-local` is an offline coverage check; use `--verify` when updating pins to check upstream provenance as well.

## Data and privacy

Lists are stored in `localStorage` for the current browser and origin. They are not synced between devices. Clearing browser data, ending a private browsing session, or losing the device can remove your lists. Moving to a different origin creates a separate storage area.

Board names are limited to 40 characters and task titles to 200. Board names must be unique. The last active board cannot be archived or deleted, and deleting a board requires confirmation because its tasks are also removed. Archived boards keep their tasks and can be restored from **Archived**.

Task renaming, completion, individual deletion, and clearing completed tasks can be undone for seven seconds. Adding a task or switching boards dismisses the undo notice. Unsaved input is kept per board for the current session.

Legacy `tiny.todos.v1` lists migrate into a **My list** board. Existing `tiny.boards.v2` data, including user-provided names and titles, is preserved. Invalid saved data is not overwritten.

## Organizing lists

Choose **Edit** beside the board title to show task drag handles and delete buttons, then **Done** to return to the list. Tap a task title in edit mode to rename it inline. Enter or **Save** commits the title; **Cancel** or Escape discards the draft. Empty titles are rejected, and a failed save keeps the draft open. Renaming preserves completion status and order. Tasks reorder within their active or completed group; editing disables swipe completion. Drag a handle with a mouse or touch, or focus it and use Space to pick up, arrow keys to move, and Space to drop. Escape cancels a drag. Task deletion is immediate with a seven-second **Undo**.

Open the board picker and choose its **Edit** button to reorder active boards. Board menus include **Archive**; archived boards are hidden from the picker and available under **Archived → Restore**. Archiving the current board switches to the first active board. Restoring appends the board to the active order without changing its tasks. Orders and archive status persist locally and work offline.

The existing `tiny.boards.v2` format remains compatible: boards without an archive flag are active. New data must always select an active board. Ordering uses dnd-kit for pointer, touch, keyboard, and screen-reader support; the small JSX compatibility declaration in `src/types/` adapts its stable release's older type declarations to React 19 without disabling strict checks.

## Project structure

```text
src/
  App.tsx              Composes the screen and controls overlay visibility
  layouts/             Page geometry and layout slots
  components/
    controls/          Shared button styling and native button behavior
    overlays/          Modal sheet, drag dismissal, and focus lifecycle
    feedback/          Notifications and undo feedback
    icons/             Shared SVG icons
    sorting/           Accessible sortable list and drag handles
  features/
    boards/components/ Board header, picker, list, name form, and confirmation
    tasks/components/  Task composer, groups, rows, and completed section
    tasks/hooks/       Swipe gestures and list animation lifecycle
  hooks/               App commands, persistence, notifications, offline support
  domain/              Framework-independent models and operations
  storage/             Storage validation and legacy data migration
  ui/                  Low-level animation and viewport browser integrations
scripts/               Deployment paths and service worker generation
tests/                 Vitest domain, Hook, and component tests
e2e/                   Playwright browser tests
```

### Component boundaries

`App` connects the application model to feature components through `AppLayout`. The layout owns page geometry; it does not know about boards, storage, or task operations. `useTodoApp` coordinates domain commands, persistence, board-specific drafts, and undo. Only successful storage writes become visible state updates.

Feature components receive the data and callbacks they need, such as `onSelect`, `onRename`, and `onToggle`, rather than an application-wide state setter. Temporary state stays near its owner: the board name form owns its draft and native validation, the completed section owns folding, and the board picker owns its navigation and save errors.

`BottomSheet` handles native dialog behavior, focus return, dismissal, and animation cleanup independently of board management. The board picker keeps the outgoing content visible until its exit finishes. Gesture and list-animation Hooks keep browser integrations separate from task markup.

Styles are colocated CSS Modules. Global CSS contains only resets and shared defaults. Browser integrations register and clean up through React effects. Storage updates do not wait for animations.

## Contributing

[Issues](https://github.com/ueokande/tinytodo/issues) and pull requests are welcome. Include reproduction steps for bugs and tests for behavior changes. Run `pnpm check`, `pnpm test`, and `pnpm test:e2e` before submitting a pull request.

## License

A license has not yet been specified.
