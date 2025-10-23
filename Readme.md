<img width="1319" height="423" alt="image" src="https://github.com/user-attachments/assets/1149290d-c196-4c1f-b5ab-a0caba45b10c" />
<div align="center">

  [![npm version](https://img.shields.io/npm/v/@gunjanghate/git-genie.svg)](https://www.npmjs.com/package/@gunjanghate/git-genie)
  [![Downloads](https://img.shields.io/npm/dm/@gunjanghate/git-genie.svg)](https://www.npmjs.com/package/@gunjanghate/git-genie)

</div>

# GitGenie CLI - Complete Documentation



## Overview

**GitGenie** is an intelligent command-line interface (CLI) tool designed to simplify and automate Git workflows. It handles common Git operations like committing, branch management, staging, and pushing, while optionally integrating AI-generated commit messages using Google Gemini. This comprehensive documentation details all features, configurations, and functionality implemented to date.

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

# Direct to main branch
gg "update documentation" --no-branch
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
- Interactive branch management with auto-suggestions
- Automated merge-to-main workflows
- Retry logic for network operations
- Professional error handling and user feedback
- Cross-platform configuration management

## CLI Commands and Options

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
- `--type <type>`: Commit type (default: `feat`)
- `--scope <scope>`: Optional scope for commit message
- `--genie`: Enable AI commit message generation using Google Gemini
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

### 10. Example Usage & Sample Commands

#### Basic Usage:

```powershell
# Navigate to project directory
cd "d:\my\GUNJAN\Git genie"

# Install dependencies (if needed)
npm install

# Basic commit with manual message (default behavior)
node index.js "add new feature"

# Commit with AI-generated message using Gemini
node index.js "fix authentication bug" --genie

# Commit with specific type and scope
node index.js "fix authentication bug" --type fix --scope auth

# Commit with AI, specific type and scope
node index.js "optimize database queries" --type perf --scope db --genie

# Commit directly to main branch (no AI)
node index.js "update documentation" --no-branch

# Automatically merge to main and push
node index.js "add user dashboard" --type feat --push-to-main

# Initialize new repo with remote
node index.js "initial commit" --remote https://github.com/username/repo.git --no-branch
```

#### Interactive Workflow Example:

```powershell
# Run with interactive prompts
node index.js "implement user management"

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
node index.js "test file modifications" --type test --scope cli --genie

# Bug fix with specific scope (manual commit)
node index.js "resolve merge conflicts" --type fix --scope git

# Feature addition with AI-generated commit message
node index.js "add interactive branch selection" --type feat --scope branch --genie

# Documentation update directly to main
node index.js "update README with examples" --type docs --no-branch

# Performance improvement with AI and auto-merge to main
node index.js "optimize database queries" --type perf --scope db --genie --push-to-main
```

#### Legacy Examples:

```bash
# First commit to a new repo, main branch, manual commit
node index.js "initial commit" --no-branch --remote https://github.com/username/git-genie.git

# Commit to existing repo, interactive branch selection & AI commit
node index.js "add interactive branch selection" --type feat --scope commit --genie

# Commit to current branch directly with manual message
node index.js "fix typo in README" --no-branch
```

### 11. Current Workflow Summary

1. CLI parses user input and options.
2. Initializes Git repository if none exists.
3. Adds remote origin if provided.
4. Checks for existing commits.
5. Prompts the user to choose the branch (interactive) or commits directly to main if `--no-branch`.
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
✅ **Interactive Branch Management** - User-friendly branch creation and switching  
✅ **Smart Error Handling** - Graceful fallbacks and retry mechanisms  
✅ **Professional Formatting** - Conventional Commit standards  
✅ **Colored Output** - Clear visual feedback with chalk  
✅ **Spinner Feedback** - Real-time progress indicators  
✅ **Flexible Configuration** - Multiple CLI options for different workflows

## 🧪 Testing Commands

```powershell
# Test basic functionality
node index.js "test basic functionality" --no-ai --no-branch

# Test AI commit generation
node index.js "test AI commit generation" --type test

# Test branch creation
node index.js "test branch creation" --type feat --scope testing

# Test error handling (no changes)
node index.js "test no changes scenario" --no-branch

# Test with different commit types
node index.js "test documentation" --type docs
node index.js "test bug fix" --type fix
node index.js "test refactoring" --type refactor
```

## 📋 Current Project Status

- **Repository:** `git-genie` by `gunjanghate`
- **Current Branch:** `change/text2`
- **Default Branch:** `main`
- **Status:** Active development with test files for functionality validation

---

## Notes & Future Considerations

- Can implement **last-used branch suggestion** for faster workflow.
- Optional integration with other AI models for commit suggestions.
- Ability to include commit templates for faster conventional commit adherence.
- Extend CLI with commands like `git-genie status`, `git-genie log`, etc.
- Add support for conventional commit scopes validation.
- Implement configuration file for default settings.
- Add git hooks integration for automated workflows.

---

This document captures the current state of **Git genie CLI**, including all features, functionality, CLI behavior, project structure, and comprehensive usage examples. It serves as a complete reference for users and developers working with or extending the tool.
