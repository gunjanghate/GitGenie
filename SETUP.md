# GitGenie Contributor Setup Guide

Welcome to GitGenie! This guide will help you understand the project structure and set up your local development environment correctly.

---

## 🏗️ Project Structure Overview

GitGenie consists of **two distinct parts**:

### 1. **Website** (Repository Root)
- **Location**: Root directory (`/app`, `/components`, `/lib`, etc.)
- **Purpose**: Marketing site and documentation for GitGenie
- **Technology**: Next.js (App Router), React, TypeScript, Tailwind CSS
- **Package Manager**: **pnpm** ⚠️

### 2. **CLI Tool** (CLI Directory)
- **Location**: `/cli` directory
- **Purpose**: The actual GitGenie command-line tool (`gg` command)
- **Technology**: Node.js CLI application
- **Package Manager**: **npm** or **pnpm**

> **Important**: These are separate projects with different setup requirements. Follow the instructions for the part you want to contribute to.

---

## 🌐 Website Setup

The website uses **pnpm** for package management. Using npm or yarn will cause lockfile conflicts and deployment issues.

### Prerequisites
- Node.js `>= 18`
- pnpm (install globally if needed):
  ```bash
  npm install -g pnpm
  ```

### Setup Steps

1. **Fork and clone the repository**:
   ```bash
   git clone https://github.com/<your-username>/GitGenie.git
   cd GitGenie
   ```

2. **Install dependencies** (⚠️ use pnpm, not npm):
   ```bash
   pnpm install
   ```

3. **Start the development server**:
   ```bash
   pnpm dev
   ```

4. **Open in browser**:
   - Navigate to http://localhost:3000

### Available Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Build for production
pnpm start        # Run production build
pnpm lint         # Run linter
```

### ⚠️ Important: Do NOT use npm for the website
```bash
# ❌ WRONG - Do not do this in the root directory
npm install
npm run dev

# ✅ CORRECT - Always use pnpm for the website
pnpm install
pnpm dev
```

**Why?** Using npm will:
- Create a conflicting `package-lock.json` alongside `pnpm-lock.yaml`
- Cause version inconsistencies
- Break CI/CD deployments
- Create merge conflicts

---

## 🔧 CLI Setup

The CLI tool is a separate Node.js application located in the `/cli` directory.

### Prerequisites
- Node.js `>= 18`
- npm (comes with Node.js) or pnpm

### Setup Steps

1. **Navigate to the CLI directory**:
   ```bash
   cd cli
   ```

2. **Install dependencies**:
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Run the CLI locally**:
   ```bash
   node index.js
   # or use the local binary
   ./bin/gg.js
   ```

4. **Test CLI commands**:
   ```bash
   node index.js --help
   node index.js --version
   ```

### Available Commands

```bash
npm install       # Install dependencies
npm test          # Run tests (if available)
node index.js     # Run CLI locally
```

### CLI Development Tips
- The main entry point is `index.js` or `bin/gg.js`
- For CLI-specific contribution guidelines, see `cli/CONTRIBUTING.md`
- Test your changes with various Git repositories before submitting

---

## 🚫 Common Mistakes to Avoid

### 1. **Using npm in the website root**
```bash
# ❌ WRONG
cd GitGenie
npm install

# ✅ CORRECT
cd GitGenie
pnpm install
```

### 2. **Mixing commands between website and CLI**
```bash
# ❌ WRONG - Running website commands in CLI directory
cd cli
pnpm dev  # The CLI has no dev server

# ✅ CORRECT - Use appropriate commands for each part
cd cli
node index.js
```

### 3. **Editing the wrong package.json**
- `/package.json` → Website dependencies
- `/cli/package.json` → CLI dependencies
- Make sure you're editing the right file for your contribution

### 4. **Creating conflicting lockfiles**
- Never commit both `package-lock.json` and `pnpm-lock.yaml` in the root
- The root should only have `pnpm-lock.yaml`

### 5. **Installing in the wrong directory**
```bash
# ❌ WRONG - Installing website deps from CLI folder
cd cli
pnpm install  # This installs CLI deps, not website deps

# ✅ CORRECT - Install from the correct directory
cd GitGenie        # For website
pnpm install

cd GitGenie/cli    # For CLI
npm install
```

---

## 🧭 Quick Reference

### "I want to contribute to the website/docs"
1. Stay in the **root directory**
2. Use **pnpm** for all commands
3. Run `pnpm dev` to start
4. Read `CONTRIBUTING.md` for guidelines

### "I want to contribute to the CLI tool"
1. Navigate to **`/cli` directory**
2. Use **npm** or **pnpm**
3. Run `node index.js` to test
4. Read `cli/CONTRIBUTING.md` for guidelines

---

## 📚 Additional Resources

- **Website Contributing Guide**: `CONTRIBUTING.md`
- **CLI Contributing Guide**: `cli/CONTRIBUTING.md`
- **CLI Documentation**: `cli/README.md`
- **Issue Tracker**: [GitHub Issues](https://github.com/username/GitGenie/issues)

---

## ❓ Need Help?

If you encounter issues during setup:
1. Check that you're using the correct package manager (pnpm for website, npm/pnpm for CLI)
2. Verify you're in the correct directory
3. Ensure Node.js version is >= 18
4. Open an issue on GitHub with details about your setup problem

---
