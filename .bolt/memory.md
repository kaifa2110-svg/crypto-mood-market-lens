# Project memory

## Product intent & audience

- Web app built with Vite + React (inferred from framework tag `vite-react`).

## Brand personality & voice

- Not yet inferred.

## Visual design & UX direction

- Not yet inferred.

## Decisions, constraints & rationale

- Framework: Vite + React.
- Dev server command: `bunx vite --host` or `npm run dev`.
- Platform constraint: long-lived dev servers cannot be launched from the assistant's shell; the live preview pane on the right is managed automatically by the platform. Nudge by refreshing the preview toolbar or sending another message.
- Build passes cleanly.
- Test suite contains 18 tests, all green.
- Dependencies are installed.

## Open questions & assumptions

- Assumption: production preview is served from a successful build, not a running dev process.
- Unknown: package manager preference (bun vs npm) — both mentioned by user.
- Unknown: app purpose, audience, branding, and visual direction — not yet established.