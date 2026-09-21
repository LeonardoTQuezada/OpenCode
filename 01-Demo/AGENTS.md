# AGENTS.md

## What this repo is
A learning/demo repo for exploring OpenCode: one static HTML page. Everything
editable lives in `index.html`; styles are Tailwind utility classes in the
markup. The README is in Spanish.

## Tailwind CSS (v4, browser/CDN build)
- Loaded at runtime by the CDN script in `<head>`: `@tailwindcss/browser@4`. No build step and no `package.json`.
- Use utility classes directly in the HTML.
- Theme is configured CSS-first inside `<style type="text/tailwindcss">` using `@theme`. Do **not** create `tailwind.config.js`; Tailwind v4 does not use it by default.
- Custom token in use: `--color-pastel: #B4E2B4` (used as `bg-pastel` on `<body>`).
- The CDN build is for demo/learning only, not production. Producing a static CSS file would require the npm CLI (`tailwindcss` + `@tailwindcss/cli`), which is intentionally not set up.

## No build/test tooling — do not invent one
- No `package.json`, lockfile, bundler, dev server, tests, lint, or CI.
- Do not run `npm install` or build/test commands; there is nothing to run.
- To verify changes, open `index.html` directly in a browser.

## Environment gotchas
- Node is **not** on the Linux `PATH` (`node -v` fails). Only the Windows install is reachable via WSL interop at `/mnt/c/Program Files/nodejs` (`node.exe`, `npm.cmd`).
- The repo lives in a OneDrive-synced folder; avoid creating large `node_modules` trees there.

## Git state
- Repo is initialized but has **zero commits**; all files are untracked.
- No remote is configured. Don't assume a PR/branch workflow.

## Conventions
- No shared stylesheet or component structure — keep edits in `index.html`.
- README mentions JavaScript, but there is still no JS in the project.
