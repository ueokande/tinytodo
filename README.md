# TinyToDo

[![CI](https://github.com/ueokande/tinytodo/actions/workflows/ci.yml/badge.svg)](https://github.com/ueokande/tinytodo/actions/workflows/ci.yml)

A minimal, offline-first to-do app for shopping lists and quick notes. Built with React, TypeScript, and CSS Modules, with all list data stored on your device.

## Features

- Title-only tasks, organized into multiple boards.
- Swipe right or tap the circle to complete a task.
- A bottom input bar for quick, one-handed entry.
- Undo task completion and clearing completed tasks.
- Create, rename, and delete boards; remember the last board you opened.
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

## Data and privacy

Lists are stored in `localStorage` for the current browser and origin. They are not synced between devices. Clearing browser data, ending a private browsing session, or losing the device can remove your lists. Moving to a different origin creates a separate storage area.

Board names are limited to 40 characters and task titles to 200. Board names must be unique. The last remaining board cannot be deleted, and deleting a board requires confirmation because its tasks are also removed.

Task completion and clearing completed tasks can be undone for seven seconds. Adding a task or switching boards dismisses the undo notice. Unsaved input is kept per board for the current session.

Legacy `tiny.todos.v1` lists migrate into a **My list** board. Existing `tiny.boards.v2` data, including user-provided names and titles, is preserved. Invalid saved data is not overwritten.

## Project structure

```text
src/
  App.tsx         Application composition and task actions
  components/     React components and colocated CSS Modules
  hooks/          Persistent board state and notification state
  domain/         Framework-independent models and operations
  storage/        Storage validation and legacy data migration
  ui/             Animation and viewport browser integrations
scripts/          Deployment paths and service worker generation
tests/            Vitest unit and Hook tests
e2e/              Playwright browser tests
```

Global CSS contains only resets and shared defaults. Browser integrations are attached and cleaned up through React effects. Animations use the Web Animations API and CSS; storage updates do not wait for animation completion.

## Contributing

[Issues](https://github.com/ueokande/tinytodo/issues) and pull requests are welcome. Include reproduction steps for bugs and tests for behavior changes. Run `pnpm check`, `pnpm test`, and `pnpm test:e2e` before submitting a pull request.

## License

A license has not yet been specified.
