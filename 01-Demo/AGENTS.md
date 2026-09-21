# AGENTS.md

## What this repo is
A learning/demo repo for exploring OpenCode: one static HTML page. Everything
editable lives in `index.html`; styles are inline in the `<style>` block in the
head. The README is in Spanish.

## No toolchain — do not invent one
- No `package.json`, lockfile, bundler, dev server, tests, lint, or CI.
- Do not run `npm install`, `npm run`, build, or test commands; there is nothing to run.
- To verify changes, open `index.html` directly in a browser (or use the browser preview tool if connected).
- README lists "Tailwind CSS" and "JavaScript" as technologies used, but neither is present (no CDN link, no Tailwind config, no script). Trust the code, not the README, unless the task is to add them.

## Git state
- Repo is initialized but has **zero commits**; `index.html` and `README.md` are untracked.
- No remote is configured. Don't assume a PR/branch workflow.

## Conventions
- The page has no shared stylesheet or component structure — keep edits inline in `index.html`.
