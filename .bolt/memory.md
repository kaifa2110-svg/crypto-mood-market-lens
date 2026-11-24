# Project memory

## Product intent & audience

- Web app built with Vite + React (inferred from framework tag `vite-react`).
- Project appears to be Lovable-generated: uses `@lovable.dev/vite-tanstack-config` for Vite config.

## Brand personality & voice

- Not yet inferred.

## Visual design & UX direction

- Not yet inferred.

## Decisions, constraints & rationale

- Framework: Vite + React.
- Dev server command: `bunx vite --host` or `npm run dev`.
- Platform constraint: long-lived dev servers cannot be launched from the assistant's shell; the live preview pane on the right is managed automatically by the platform. Nudge by refreshing the preview toolbar or sending another message.
- Vite config provided by `@lovable.dev/vite-tanstack-config` (must be resolvable for build/deploy).
- vitest pinned to 4.0.3 — vitest 4.1.x triggered an npm resolver bug that prevented full dependency resolution, causing `@lovable.dev/vite-tanstack-config` to go missing during deployment. Rationale: 4.0.3 installs cleanly.
- Both `package-lock.json` and `bun.lock` are regenerated and consistent.
- Build passes cleanly.
- Test suite contains 18 tests, all green.
- Clean install from scratch verified working.

## Open questions & assumptions

- Assumption: production preview is served from a successful build, not a running dev process.
- Unknown: package manager preference (bun vs npm) — both lockfiles present.
- Unknown: app purpose, audience, branding, and visual direction — not yet established.