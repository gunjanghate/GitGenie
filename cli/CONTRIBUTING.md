# Contributing to GitGenie CLI

Thank you for contributing to the **GitGenie CLI** (`gg`)! This guide covers developing and testing the CLI located in the `cli/` directory. For the website/docs, see the root `CONTRIBUTING.md`.

---

## 1. Scope

This document applies to:

- CLI source in `cli/index.js`
- Helper modules in `cli/helpers/`
- Scripts in `cli/scripts/`
- CLI documentation in `cli/README.md`

The website (Next.js app) and marketing pages are documented in the root `CONTRIBUTING.md`.

---

## 2. Prerequisites

- **Node.js**: `>= 18` (required by the CLI `engines` field)
- **pnpm**: we use pnpm for all package management

  ```bash
  npm install -g pnpm
  ```

- A GitHub account and a basic understanding of Git.
- (Optional but recommended) A **Gemini API key** to test AI‑powered commit messages.

---

## 3. Local Setup (CLI)

From the repo root:

```bash
cd cli
pnpm install
```

This installs the CLI dependencies defined in `cli/package.json` using pnpm.

---

## 4. Running the CLI Locally

You can develop and test the CLI in two main ways.

### 4.1 Direct execution from source

From inside `cli/`:

```bash
# In any git repo you want to test against
node ./index.js "add new feature"
node ./index.js "fix bug" --type fix
node ./index.js "use AI message" --genie
```

This is useful for quick iteration while editing `index.js` and helper files.

### 4.2 Global link with pnpm (recommended for real‑world testing)

1. From `cli/`:

   ```bash
   pnpm link --global
   ```

2. In any test Git repository on your machine, you can now run:

   ```bash
   gg "add new feature"
   gg "fix bug" --type fix --scope api
   gg "use AI message" --genie
   gg b feature/new-ui
   gg s main
   gg wt feature/new-ui
   gg cl https://github.com/username/repo.git
   ```

This mimics the installed NPM package behavior while using your local code.

---

## 5. Configuration for AI Features

To test Gemini‑powered commit messages, configure your API key via one of the supported methods (see CLI README for details):

```bash
# Recommended
gg config YOUR_GEMINI_API_KEY

# Or via environment variable
export GEMINI_API_KEY="your_api_key_here"
```

Ensure this is set in the environment where you run the CLI.

---

## 6. Tests and Quality Checks

At the moment there is no automated test suite for the CLI package (`pnpm test` is a placeholder). Please focus on **manual testing** of key flows:

- Basic manual commit: `gg "add new feature"`
- AI commit: `gg "fix bug" --genie`
- Commit type auto‑detection (no `--type`, non‑genie mode)
- Branch and worktree shortcuts: `gg b`, `gg s`, `gg wt`, `gg cl`
- `--no-branch`, `--push-to-main`, and `--osc` flows

Before opening a PR:

1. Verify the CLI works in a **clean test Git repo**.
2. Test on at least one platform you have available (Windows, macOS, or Linux).
3. Run a quick sanity check of the install script:

   ```bash
   pnpm install
   ```

---

## 7. Coding Guidelines

- Keep the user experience **simple and clear**; error messages should be actionable.
- Follow existing patterns in `index.js` and `cli/helpers/` for:
  - Prompting (inquirer)
  - Git operations (simple-git)
  - Logging/styling (chalk, ora)
- Prefer small, focused functions in helpers over large monolithic flows.
- Avoid introducing new dependencies unless they provide clear value; discuss first in an issue if unsure.

### Commit messages

We recommend using **Conventional Commits**:

- `feat: add new shortcut`
- `fix: handle empty diff case`
- `docs: update CLI usage examples`
- `refactor: simplify branch flow`

This keeps history consistent with how users are encouraged to use GitGenie itself.

---

## 8. Updating Documentation

If you change CLI behavior or add options:

- Update command and option references in `cli/README.md`.
- If the change is user‑facing and relevant to the website, sync any examples in the docs page under `app/docs/`.

---

## 9. Submitting a Pull Request

1. Create a branch from `main` (or the active feature branch):

   ```bash
   git checkout main
   git pull origin main
   git checkout -b feat/cli-my-change
   ```

2. Make your changes and manually test key flows.
3. Commit using a descriptive message (preferably Conventional Commits).
4. Push your branch and open a PR:
   - Clearly describe the problem, the solution, and how to reproduce/test.
   - Include example commands for reviewers to run (especially CLI commands).

By using **pnpm** consistently and following these guidelines, you help keep the GitGenie CLI reliable and easy to maintain.
