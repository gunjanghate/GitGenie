<img width="1319" height="423" alt="image" src="https://github.com/user-attachments/assets/1149290d-c196-4c1f-b5ab-a0caba45b10c" />
<div align="center">

  [![npm version](https://img.shields.io/npm/v/@gunjanghate/git-genie.svg)](https://www.npmjs.com/package/@gunjanghate/git-genie)
  [![Downloads](https://img.shields.io/npm/dm/@gunjanghate/git-genie.svg)](https://www.npmjs.com/package/@gunjanghate/git-genie)

</div>

<img src="https://contributors-img.web.app/image?repo=gunjanghate/GitGenie"/>

# GitGenie CLI - Complete Documentation



## Overview

**GitGenie** is an intelligent command-line interface (CLI) tool designed to simplify and automate Git workflows. It handles common Git operations like committing, branch management, staging, and pushing, while optionally integrating AI-generated commit messages using Google Gemini. This comprehensive documentation details all features, configurations, and functionality implemented to date.

## What's New

- Interactive Command Palette: running `gg` with no arguments opens a menu to pick actions; it shows the exact command it will run.
- Shortcuts: `gg b`, `gg s`, `gg wt`, `gg cl` for fast branch/worktree/clone flows.
- Auto-Detect Commit Type: in non-genie mode, if you don’t pass `--type`, the CLI infers a sensible commit type from the diff.
- Non-interactive flags:
  - `--no-branch` skips the branch prompt and commits directly to `main`.
  - `--push-to-main` pushes automatically. If you’re on a feature branch, it merges into `main` and pushes; if you’re on `main`, it just pushes.

## Quick Start

### Installation

```bash
npm install -g @gunjanghate/git-genie
```

### Configuration

Before using AI features, configure your Gemini API key:

```bash
gg config YOUR_GEMINI_API_KEY
```

### Basic Usage

```bash
# Manual commit message (default)
gg "add new feature"

# AI-generated commit message
gg "fix authentication bug" --genie

# Commit directly to main (skip branch prompt)
gg "update documentation" --no-branch

# Merge to main and push after commit
gg "add dashboard" --type feat --push-to-main
```

## Configuration Management

### Setting up Gemini API Key

GitGenie supports multiple ways to configure your Gemini API key:

#### Method 1: Using the config command (Recommended)

```bash
gg config YOUR_GEMINI_API_KEY
```

This saves the API key to `~/.gitgenie/config.json` for persistent use across all projects.

#### Method 2: Environment variable

```bash
export GEMINI_API_KEY="your_api_key_here"
```

#### Method 3: .env file in project directory

Create a `.env` file in your project root:

```properties
GEMINI_API_KEY=your_api_key_here
```

**Priority Order:** Environment variable > Config file > .env file

### Getting a Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Configure it using one of the methods above

## Key Features

- Validates Git repository existence and initializes if needed
- Automatic file staging with progress feedback
- AI-powered commit message generation using Google Gemini
- Open source contribution workflow with --osc flag (issue-based branch naming)
- Interactive branch management with auto-suggestions
- Automated merge-to-main workflows
- Retry logic for network operations
- Professional error handling and user feedback
- Cross-platform configuration management

## CLI Commands and Options

### Branch Management Shortcuts

GitGenie now includes convenient shortcut commands for branch management and worktree operations:

- `gg b <branchName>`: Create and switch to a new branch
- `gg s <branchName>`: Switch to an existing branch
- `gg wt <branchName> [path]`: Create a worktree for a branch at an optional path
- `gg cl <repoUrl> [directory]`: Clone a repository into an optional directory

#### Examples:

```bash
# Create and switch to a new branch
gg b feature/new-ui

# Switch to an existing branch
gg s main

# Create a worktree for a branch (default path is a folder named after the branch)
gg wt pr2

# Create a worktree for a branch at a custom path
gg wt pr2 ../pr2-folder

# Clone a repository
gg cl https://github.com/username/repo.git

# Clone a repository to a specific directory
gg cl https://github.com/username/repo.git my-custom-folder
```

### Command Palette (no-args menu)

- Run `gg` with no arguments to open an interactive menu.
- Pick actions like “commit”, “b”, “s”, “wt”, or “cl”.
- The palette prints the exact command it will run and then executes it.

Example

```
gg
→ Running: gg "add login retries" --type fix --scope auth
```

These shortcuts make branch and worktree management faster and easier, especially for advanced workflows and multi-branch development.

### Interactive Commit Categorization (`gg split`)

GitGenie now includes an intelligent commit splitting feature that analyzes your staged changes and groups them into logical, atomic commits.

**Problem it solves:** Developers often work on multiple things simultaneously—fixing a bug, refactoring a function, and updating documentation—before running `git commit`. Committing all these changes together (the "Mega-Commit") leads to messy history, hard code reviews, and risky reverts.

**Solution:** `gg split` uses AI to detect semantic relationships between files and suggests breaking them down by feature, refactor, or file dependency.

#### Usage

```bash
# Basic usage (AI-powered if API key configured)
gg split

# Force heuristic grouping (no AI)
gg split --no-genie

# Preview groups without committing
gg split --dry-run

# Auto-commit all groups without confirmation
gg split --auto

# Limit maximum number of groups
gg split --max-groups 3
```

#### Workflow Example

```bash
# You have multiple changes staged
git add src/auth.js src/auth.test.js src/components/Navbar.css README.md

# Run split
gg split

# Output:
# 📋 Detected Groups:
# 
# [Group 1] feat(auth): add login session handling
#   Files (2):
#   • src/auth.js
#   • src/auth.test.js
# 
# [Group 2] fix(ui): resolve navbar z-index issue
#   Files (1):
#   • src/components/Navbar.css
# 
# [Group 3] docs: update installation guide
#   Files (1):
#   • README.md
#
# ? How would you like to proceed?
#   ✓ Commit all groups as suggested
#   ✏️  Review and edit each group
#   🔀 Merge groups together
#   ❌ Cancel
```

#### Options

- `--genie`: Use AI-powered grouping (default if API key exists)
- `--no-genie`: Use heuristic grouping only (groups by file type and directory)
- `--auto`: Auto-commit all groups without confirmation (non-interactive mode)
- `--dry-run`: Preview groups without committing
- `--max-groups <n>`: Limit maximum number of groups (default: 5)

#### Features

- **AI-Powered Grouping**: Uses Google Gemini to analyze semantic relationships
- **Heuristic Fallback**: Works without API key using smart file categorization
- **Interactive Review**: Edit commit messages, merge groups, or skip groups
- **Error Handling**: Graceful handling of all edge cases and failures
- **Atomic Commits**: Creates clean, logical commit history

#### Error Handling

The split command handles all error scenarios gracefully:
- No staged changes → prompts to stage
- Single file → suggests using regular commit
- API failures → falls back to heuristic grouping
- Network timeouts → automatic fallback
- Git operation failures → option to continue or abort
- User cancellation (Ctrl+C) → clean exit


### Main Command

```bash
gg <description> [options]
```

### Configuration Command

```bash
gg config <api-key>    # Save Gemini API key for persistent use
```

### Available Options

- `<desc>`: Short description of the change (mandatory)
- `--type <type>`: Commit type (if omitted and not using `--genie`, GitGenie will auto-detect a likely type from your changes)
- `--scope <scope>`: Optional scope for commit message
- `--genie`: Enable AI commit message generation using Google Gemini
- Auto-detect commit type (non-genie): If you don’t pass `--type` and you’re not using `--genie`, GitGenie will infer a likely type from your changes.
- `--osc`: Open source contribution branch format (prompts for issue number, branch name: type/#issue-shorttitle)
- `--no-branch`: Skip interactive branch choice and commit to main
- `--push-to-main`: Automatically merge current branch to main and push
- `--remote <url>`: Add remote origin if repo is new

### Supported Commit Types

- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `ci`: CI/CD changes
- `build`: Build system changes
- `perf`: Performance improvements

## 🏗 Architecture & Workflow

To help visualize how GitGenie handles your Git operations, the following diagrams outline the internal logic.

### 1. Main Command Flow (`gg <desc>`)

```mermaid
graph TD
    Start([gg command]) --> Repo{Repo exists?}
    Repo -- No --> Init[git init]
    Repo -- Yes --> Remote[Remote Origin Setup]
    
    Init --> Remote
    Remote --> History{Existing Commits?}
    
    History -- No --> MainOnly[Force Main Branch]
    History -- Yes --> BranchCheck{--no-branch or Detached HEAD?}
    
    MainOnly --> Staging
    BranchCheck -- Yes --> Staging
    BranchCheck -- No --> Menu[Interactive Branch Menu]
    
    Menu --> BranchType{Choice}
    BranchType -- Current --> Staging
    BranchType -- New --> OSCCheck{--osc flag?}
    
    OSCCheck -- Yes --> OSC[OSC/Issue-branch Flow]
    OSCCheck -- No --> Std[Std Branch Flow]
    
    OSC --> Staging
    Std --> Staging
    
    subgraph Staging_Process [Multi-Step Staging]
    Staging[Check Cached Diff] --> DiffCheck{Changes Found?}
    DiffCheck -- No --> StageAll[Prompt & git add .]
    DiffCheck -- Yes --> Verify[Verify Staging]
    StageAll --> Verify
    end
    
    Verify --> GenieMode{--genie flag?}
    GenieMode -- Yes --> AI[Gemini Mode: Skip Auto-detect]
    GenieMode -- No --> TypeCheck{--type provided?}
    
    TypeCheck -- Yes --> Manual[Apply Manual Type]
    TypeCheck -- No --> Auto[Auto-detect Commit Type]
    
    AI --> Commit[git commit]
    Manual --> Commit
    Auto --> Commit
    
    Commit --> PostCommit{--push-to-main?}
    PostCommit -- Yes --> PushLogic
    PostCommit -- No --> PushPrompt[Interactive Push Prompt]
```

### 2. Intelligent Commit Splitting (`gg split`)
```mermaid
graph TD
    S[gg split] --> Diff[Analyze Staged Changes]
    Diff --> Mode{--no-genie?}
    
    Mode -- No --> AI[Gemini API: Group by Logic]
    Mode -- Yes --> Heuristic[Heuristic: Group by File Type]
    
    AI --> Review[Interactive Review Menu]
    Heuristic --> Review
    
    Review --> Choice{User Choice}
    Choice -- Edit --> Edit[Modify Groups/Messages]
    Choice -- Merge --> Merge[Combine Groups]
    Choice -- Commit --> Exec[Loop: Atomic Commits]
    
    Edit --> Review
    Merge --> Review
    Exec --> Done([Clean Working Tree])
  ```

### 3. Push & Merge Automation
```mermaid
graph TD
    PushStart[Start Push Workflow] --> RemoteCheck[ensureRemoteOriginInteractive]
    RemoteCheck --> BranchLoc{Current Branch?}
    
    BranchLoc -- is main --> Direct[git push origin main]
    
    BranchLoc -- is feature --> Merge[Merge into main]
    Merge --> P[git push origin main]
    P --> Cleanup[Delete Local & Remote Feature Branch]
    
    Direct --> Final([Success Message])
    Cleanup --> Final
    
    subgraph Error_State [Process Exit]
    Direct -- Fail --> Err[Throw Error & Exit]
    P -- Fail --> Err
    end
```

> **Note for Contributors:** If you modify the orchestration logic in `index.js` or `split.js`, please ensure these diagrams are updated to reflect those changes.

## Project Structure

```
GitGenie Project/
├── ~/.gitgenie/
│   └── config.json           # User configuration file
├── .env                      # Optional project environment variables
├── .git/                     # Git repository data
├── .gitignore               # Git ignore rules
├── index.js                 # Main application logic
├── node_modules/            # Dependencies
├── package.json             # Project configuration & dependencies
├── package-lock.json        # Locked dependency versions
└── README.md                # This documentation
```

## Core Features

### 1. Git Repository Management

- Automatic repository detection and initialization
- Smart remote origin setup
- Default branch configuration to `main`
- Comprehensive repository state validation

### 2. Intelligent Branch Management

- Interactive branch selection with current branch display
- Auto-suggested branch names using format: `type/description-YYYY-MM-DD`
- Support for direct main branch commits with `--no-branch`
- Safe branch creation and switching

### 3. Automated File Staging

- Detects unstaged changes automatically
- Stages all files when no staged changes found
- Progress feedback during staging operations
- Robust error handling for staging failures

### 4. Commit Message Generation

- **Manual mode (default)**: Uses conventional commit format `type(scope): description`
- **AI mode (--genie)**: Powered by Google Gemini 2.0 Flash model
- Professional Conventional Commits specification compliance
- Intelligent analysis of code diffs for contextual commit messages
- Graceful fallback to manual mode when AI fails
- Support for all conventional commit types and scopes

#### Auto-detect commit type (non-genie)

- When you don’t pass `--type` and you’re not using `--genie`, GitGenie analyzes your staged changes and picks a suitable commit type (e.g., `fix`, `docs`, `refactor`).
- You’ll see a log like:

  ```
  🧠 Auto-detected commit type: fix
  ```

- Override any time by passing `--type <type>` explicitly.

### 5. Advanced Push and Merge Workflows

- Interactive push confirmation with retry logic
- Automated merge-to-main functionality with `--push-to-main`
- Feature branch cleanup after successful merges
- Remote branch synchronization and management
- Network failure resilience with automatic retries

### 6. Professional User Experience

- Clean, corporate-friendly messaging
- Real-time progress indicators with spinners
- Colored output for better readability
- Comprehensive error handling with helpful messages
- Cross-platform compatibility

## Dependencies & Technology Stack

### Core Dependencies

- **@google/generative-ai** (latest): Google Gemini AI integration
- **commander** (v14.0.0): CLI argument parsing and command structure
- **simple-git** (v3.28.0): Git operations and repository management
- **inquirer** (v12.9.2): Interactive command line prompts
- **chalk** (v5.5.0): Terminal color and styling
- **ora** (v8.2.0): Progress spinners and status indicators
- **dotenv** (v17.2.1): Environment variable management

### Project Configuration

- **Package**: `gitgenie-cli`
- **Version**: `1.0.0+`
- **Module Type**: ES6 modules
- **Global Command**: `gg`
- **Entry Point**: `index.js`
- **Node Version**: 16+ recommended

### Example Usage & Sample Commands

# Open source contribution branch (manual short title)

gg "fix login bug" --osc

# Open source contribution branch (AI short title)

gg "fix login bug" --osc --genie

#### Basic Usage:

```powershell
# Navigate to project directory
cd "d:\my\GUNJAN\Git Butler"

# Install dependencies (if needed)
npm install

# Basic commit with manual message (default behavior)
gg "add new feature"

# Commit with AI-generated message using Gemini
gg "fix authentication bug" --genie

# Commit with specific type and scope
gg "fix authentication bug" --type fix --scope auth

# Commit with AI, specific type and scope
gg "optimize database queries" --type perf --scope db --genie

# Commit directly to main branch (no AI)
gg "update documentation" --no-branch

# Automatically merge to main and push
gg "add user dashboard" --type feat --push-to-main

# Initialize new repo with remote
gg "initial commit" --remote https://github.com/username/repo.git --no-branch
```

#### Interactive Workflow Example:

```powershell
# Run with interactive prompts
gg "implement user management"

# The tool will ask:
# 1. Current branch is "main". Where do you want to commit?
#    - Commit to current branch (main)
#    - Create a new branch
#
# 2. If creating new branch:
#    Enter new branch name: feat/implement-user-management-2025-09-01
#
# 3. After commit:
#    Do you want to push branch "feat/implement-user-management-2025-09-01" to remote? (Y/n)
```

#### Advanced Usage Scenarios:

```powershell
# Testing the CLI tool functionality with AI
gg "test file modifications" --type test --scope cli --genie

# Bug fix with specific scope (manual commit)
gg "resolve merge conflicts" --type fix --scope git

# Feature addition with AI-generated commit message
gg "add interactive branch selection" --type feat --scope branch --genie

# Documentation update directly to main
gg "update README with examples" --type docs --no-branch

# Performance improvement with AI and auto-merge to main
gg "optimize database queries" --type perf --scope db --genie --push-to-main
```

#### Legacy Examples:

```bash
# First commit to a new repo, main branch, manual commit
gg "initial commit" --no-branch --remote https://github.com/username/git-genie.git

# Commit to existing repo, interactive branch selection & AI commit
gg "add interactive branch selection" --type feat --scope commit --genie

# Commit to current branch directly with manual message
gg "fix typo in README" --no-branch
```

### Current Workflow Summary

1. CLI parses user input and options.
2. Initializes Git repository if none exists.
3. Adds remote origin if provided.
4. Checks for existing commits.
5. Prompts the user to choose the branch (interactive) or commits directly to main if `--no-branch`.
   - If `--osc` is used and new branch is selected, prompts for issue number and generates branch name as `type/#issue-shorttitle` (shorttitle by Gemini if --genie, otherwise from message)
6. Stages all files if needed.
7. Generates commit message (AI with `--genie` flag or manual by default).
8. Commits the changes.
9. Handles push logic based on `--push-to-main` flag or interactive prompts.
10. Optionally merges to main branch and pushes with retry logic.
11. Provides detailed console feedback for every step.

---

## 🛠 How Git genie Works (Detailed Step-by-Step)

1. **Repository Check**: Verifies if current directory is a Git repo, initializes if not
2. **Remote Setup**: Adds remote origin if provided via `--remote` flag
3. **Commit History Check**: Determines if repository has existing commits
4. **Branch Decision**:
   - If `--no-branch` or no commits: commits to main
   - Otherwise: interactive prompt to choose current branch or create new one
5. **File Staging**: Checks for staged changes, auto-stages all files if none found
6. **Commit Message Generation**:
   - Uses Gemini AI to analyze diff and generate commit message
   - Falls back to manual format if AI disabled or fails
7. **Commit Execution**: Commits staged files with generated message
8. **Push Confirmation**: Asks user if they want to push to remote
9. **Push with Retry**: Attempts to push with retry logic for network failures

## 🎯 Key Features & Benefits

✅ **Automated Git Workflows** - Reduces manual Git command typing  
✅ **AI-Generated Commit Messages** - Professional, contextual commit messages  
✅ **Open Source Contribution Helper** - Issue-based branch naming for open source PRs  
✅ **Interactive Branch Management** - User-friendly branch creation and switching  
✅ **Smart Error Handling** - Graceful fallbacks and retry mechanisms  
✅ **Professional Formatting** - Conventional Commit standards  
✅ **Colored Output** - Clear visual feedback with chalk  
✅ **Spinner Feedback** - Real-time progress indicators  
✅ **Flexible Configuration** - Multiple CLI options for different workflows

## 🧪 Testing Commands

```powershell
# Test basic functionality
gg "test basic functionality" --no-ai --no-branch

# Test AI commit generation
gg "test AI commit generation" --type test

# Test branch creation
gg "test branch creation" --type feat --scope testing

# Test error handling (no changes)
gg "test no changes scenario" --no-branch

# Test with different commit types
gg "test documentation" --type docs
gg "test bug fix" --type fix
gg "test refactoring" --type refactor
```

## 📋 Notes

- If no remote is configured, the CLI offers to add one before pushing. You can skip this and push later.
- Unknown commands provide helpful suggestions.

---

## 🤝 Contributing to GitGenie

**GitGenie** is open source, and contributions are welcome 🎉
This section is meant for first-time contributors who want to understand how the project works and how to get started safely.

### 📌 How GitGenie Works (High-Level)

At a high level, GitGenie works as follows:

+ Reads CLI input and flags using commander
+ Validates the current directory as a Git repository (or initializes one)
+ Handles branch selection (interactive or non-interactive)
+ Stages files automatically when needed
+ Generates a commit message:
  * Manually (default)
  * Or using Google Gemini when --genie is enabled
  * Commits changes
  * Optionally pushes or merges to main

Most logic lives inside index.js, which orchestrates Git operations using simple-git and user prompts via inquirer.

You do not need to understand the full internal flow to contribute documentation or small fixes.

### 🛠️ How to Clone & Run GitGenie Locally
***1️⃣ Fork the Repository***

Click `Fork` on GitHub to create your own copy of the repository.

***2️⃣ Clone Your Fork***
``` bash
git clone https://github.com/<your-username>/gitgenie-cli.git
cd gitgenie-cli
```

***3️⃣ Install Dependencies***
``` bash
npm install
```

***4️⃣ Link the CLI Locally***

+ This allows you to run the gg command while developing:
``` bash
npm link
```

+ Verify installation:
` gg --help `

**If the help output appears, GitGenie is running locally ✅**

### 🧪 How to Test Changes

It’s recommended to test GitGenie inside a temporary Git repository.
```bash
mkdir test-repo
cd test-repo
git init
```

Example test commands:

# Basic commit (manual)
` gg "test basic commit" --no-branch `

# Test AI commit message
` gg "test ai commit" --genie `

# Test branch creation
` gg "test branch flow" --type feat `

# Test error handling (no changes)
` gg "test no changes" --no-branch `


### Make sure:

* Commands execute without crashing
* Prompts behave as expected
* No unintended Git changes occur

### 🐛 Opening Issues

If you find a bug or want to suggest an improvement:

* Go to the Issues tab on GitHub
* Click New Issue
* Choose the appropriate issue template (if available)
* Clearly describe:
  + What you expected
  + What actually happened
  + Steps to reproduce (if applicable)  
  + Well-described issues help maintainers respond faster.

### 🔁 Opening a Pull Request (PR)

+ ***Branching***

* ***Do not commit directly to main.***
* Create a feature branch:
  `git checkout -b docs/improve-readme`
* Commit Your Changes
  - ``` bashgit add .```
  - ``` bash git commit -m "docs: improve contributor onboarding section" ```
* Push and Open a PR
``` bash git push origin docs/improve-readme```
* Then open a Pull Request on GitHub:
  - Base branch → main
  - Compare branch → your feature branch
  - Fill out the PR template and clearly explain what you changed and why.

### 🧩 Scope Guidelines (Important)

***To keep contributions focused:***

❌ Do NOT add new CLI features
❌ Do NOT refactor existing CLI logic
❌ Do NOT change default behaviors without discussion

✅ Documentation improvements
✅ Bug fixes
✅ Small usability improvements

***If unsure, open an issue first and ask.***

### 🙌 Need Help?

If you get stuck:
+ Comment on the issue you’re working on
+ Ask questions in the PR
+ Share error messages or screenshots
+ We would rather help than guess.

## Notes & Future Considerations

- Add interactive guided mode for beginners (e.g., --wizard)
- Add command autocomplete and suggestions
- Add onboarding welcome for first-time users
- Add undo/redo for git actions
- Add more help and examples in CLI output

- Can implement **last-used branch suggestion** for faster workflow.
- Optional integration with other AI models for commit suggestions.
- Ability to include commit templates for faster conventional commit adherence.
- Extend CLI with commands like `git-genie status`, `git-genie log`, etc.
- Add support for conventional commit scopes validation.
- Implement configuration file for default settings.
- Add git hooks integration for automated workflows.

---

This document captures the current state of **GitGenie CLI**, including all features, functionality, CLI behavior, project structure, and comprehensive usage examples. It serves as a complete reference for users and developers working with or extending the tool.
