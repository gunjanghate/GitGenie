Good. This is exactly the moment where you set standards.

Below is a **strong, clear, no-nonsense `CONTRIBUTING.md`** that will filter noise and align serious contributors.

You can copy this directly into `CONTRIBUTING.md`.

---

# Contributing to GitGenie

Thank you for your interest in contributing to GitGenie.

Before opening an issue or submitting a PR, **please read this document carefully**. Most rejected contributions happen because the proposal does not align with the project’s purpose.

---

# 📌 What GitGenie Is

GitGenie is a **CLI-based Git productivity tool**.

It is:

* A developer-focused command-line utility
* Focused on Git automation and AI-assisted workflows
* Built for speed, simplicity, and developer experience

It is NOT:

* A SaaS platform
* A dashboard product
* A user account system
* A web app requiring authentication
* A database-driven platform
* A social platform
* A UI experimentation playground

If your idea fits into one of the “NOT” categories above, it will be rejected.

---

# What Contributions Are Welcome

We actively welcome:

### CLI Improvements

* New Git workflow enhancements
* Command optimizations
* Better flags and usability improvements
* Performance improvements

### AI Provider Enhancements

* New AI provider integrations (following existing architecture)
* Improvements to provider abstraction
* Better error handling for providers
* Offline/local LLM integrations (extending current system)

### Bug Fixes

* Reproducible issues
* CLI crashes
* Incorrect Git behavior
* Provider failures

### Developer Experience

* Code quality improvements
* Refactoring without breaking architecture
* Test coverage improvements
* Documentation clarity

---

# Out of Scope (Will Be Rejected)

The following types of proposals will be closed:

* Login / Signup systems
* Authentication (JWT, OAuth, sessions, etc.)
* User accounts
* Dashboards
* Database integration
* Backend server proposals
* SaaS monetization ideas
* Unrelated UI animations
* Decorative landing page effects
* Feature ideas not related to Git workflows
* Random frontend redesign concepts

If it does not directly improve GitGenie as a CLI Git automation tool, it is out of scope.

---

# Before Opening an Issue

Ask yourself:

1. Does this improve Git workflows?
2. Does this align with a CLI-first philosophy?
3. Have I reviewed existing PRs and architecture?
4. Am I extending the system instead of redesigning it?

Low-effort or template-based issues will be closed.

---

# 🏗 Architecture Rules

GitGenie already has defined architectural patterns.

Examples:

* `AIProvider` abstraction
* `ProviderFactory` pattern
* Centralized configuration system

You must:

* Extend existing patterns
* Avoid introducing parallel systems
* Avoid breaking core abstractions
* Maintain backward compatibility

Major redesign proposals require strong technical justification.

---

# 📦 Package Manager Requirement (IMPORTANT) While working on web

This project uses **pnpm**.

You MUST:

* Use `pnpm install`
* Use `pnpm add`
* Use `pnpm run`

Do NOT:

* Use npm
* Commit `package-lock.json`
* Mix npm and pnpm

If a PR includes `package-lock.json`, it will be rejected.

Why?

Mixing npm with pnpm creates:

* Lockfile conflicts
* Dependency resolution inconsistencies
* Deployment issues
* CI failures

Stick to pnpm only.

---

# 🧪 Development Setup

```bash
pnpm install
pnpm dev
pnpm test
```

Ensure:

* No lint errors
* No test failures
* No unnecessary file changes

---

# 📝 Pull Request Guidelines

PRs must include:

* Clear description of the problem
* Explanation of the solution
* Why it aligns with GitGenie’s scope
* Screenshots or CLI output examples (if relevant)
* Confirmation that pnpm was used

PRs that introduce unrelated features will be closed.

---

# ⚠️ Final Note

GitGenie prioritizes:

* Clarity
* Simplicity
* Performance
* Developer productivity

Not every feature idea is a good fit.
Focus on meaningful improvements that align with the core mission.

If you’re unsure whether your idea fits, open a discussion first.
