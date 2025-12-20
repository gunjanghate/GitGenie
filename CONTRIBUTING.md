# Contributing to GitGenie (Website & Docs)

Thank you for your interest in contributing! This document covers contributions to the **GitGenie website and documentation** that live in this repository root. For CLI changes, please see `cli/CONTRIBUTING.md`.

---

## 1. Scope

This CONTRIBUTING guide applies to:

- The marketing / documentation site (Next.js app in `app/`)
- Shared components in `components/`
- Shared utilities/hooks in `lib/` and `hooks/`

For the published CLI package itself, see:

- `cli/README.md`
- `cli/CONTRIBUTING.md`

---

## 2. Prerequisites

- **Node.js**: `>= 18` (to match Next.js and the CLI engines requirement)
- **pnpm**: we use pnpm for all commands

  - Install globally (if you don’t have it):

    ```bash
    npm install -g pnpm
    ```

- A GitHub account and a basic understanding of Git.

---

## 3. Local Setup (Website)

1. **Fork** the repository on GitHub.
2. **Clone** your fork:

   ```bash
   git clone https://github.com/<your-username>/GitGenie.git
   cd GitGenie
   ```

3. **Install dependencies** with pnpm:

   ```bash
   pnpm install
   ```

4. **Start the dev server**:

   ```bash
   pnpm dev
   ```

5. Open the site in your browser (by default):

   - http://localhost:3000

---

## 4. Recommended Workflow

- Create a feature branch from the latest `main`:

  ```bash
  git checkout main
  git pull origin main
  git checkout -b feat/my-change
  ```

- Make your changes in `app/`, `components/`, `hooks/`, or `lib/`.
- Keep commits focused and small.
- Use **Conventional Commits** for messages, e.g.:
  - `feat: add new hero section`
  - `fix: correct docs link`
  - `docs: clarify setup instructions`

---

## 5. Running and Testing

We do not yet have a dedicated test suite for the website, but please verify the following before opening a PR:

1. **TypeScript builds** and **Next.js compiles**:

   ```bash
   pnpm build
   ```

2. **Linting** (if enabled in the project):

   ```bash
   pnpm lint
   ```

3. **Manual checks**:
   - Load the home page and docs page.
   - Verify components you touched render and behave as expected.
   - Check both light and dark themes if relevant.

---

## 6. Code Style & Conventions

- **Framework**: Next.js (App Router) with React and TypeScript.
- **Styling**: Tailwind CSS and shadcn/ui components.
- Prefer existing component patterns under `components/`.
- Keep prop names clear and descriptive; avoid one-letter names.
- Avoid introducing new libraries unless necessary; discuss in an issue first.

---

## 7. Documentation Updates

If you change user-facing behavior (especially CLI options or examples), please:

- Update relevant content in the website (e.g. docs page under `app/docs/`).
- Keep examples in sync with the CLI README in `cli/README.md` when applicable.

---

## 8. Submitting a Pull Request

1. Ensure your branch is up to date with `main`:

   ```bash
   git fetch origin
   git rebase origin/main
   ```

2. Push your branch:

   ```bash
   git push origin feat/my-change
   ```

3. Open a Pull Request on GitHub:

   - Provide a clear title using Conventional Commit style if possible.
   - Describe **what** changed and **why**.
   - Include screenshots or GIFs for UI changes where helpful.

4. Be responsive to review comments; small follow‑up commits are preferred over force‑pushing large rewrites during review.

---

## 9. CLI Contributions

For contributions to the GitGenie CLI itself (the `gg` command, Gemini integration, Git flows, etc.), please read:

- `cli/README.md` for usage and architecture overview
- `cli/CONTRIBUTING.md` for CLI‑specific setup, testing, and guidelines

Using pnpm consistently across both the website and CLI ensures reproducible installs and faster local development.
