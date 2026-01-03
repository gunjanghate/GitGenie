# Git Recovery Feature

## Overview
The `gg recover` command provides safe Git recovery functionality for lost commits, with a focus on beginner safety and clear explanations.

## Commands

### `gg recover`
Interactive recovery assistant that guides you through available options.

### `gg recover list [--count N]`
Shows recoverable commits from reflog with clear formatting.
- Default: Shows 20 entries
- Use `--count` to specify number of entries to scan

### `gg recover explain <n>`
Explains what happened at reflog entry N with detailed analysis:
- Commit information (hash, author, date, message)
- Files changed
- What the action means
- Recovery implications

### `gg recover apply <n>`
Safely applies recovery for reflog entry N:
- Creates a new recovery branch (no destructive operations)
- Preserves current work
- Provides clear next steps

## Safety Features

### Risk Classification
- **Safe**: Read-only operations, branch creation
- **Moderate**: File restoration, cherry-picking
- **Dangerous**: Reset operations, force pushes (not implemented)

### Confirmation System
- Simple y/N prompts for safe operations
- Detailed explanations for moderate risk
- "Type yes" requirement for dangerous operations

### Error Handling
- User-friendly error messages
- Helpful suggestions for common issues
- Graceful handling of edge cases

## Implementation Details

### Read-Only Operations
- `git reflog` parsing
- `git show` for commit info
- `git cat-file` for validation

### Safe Operations Only
- `git branch` (no checkout/reset/force)
- Branch creation from commit hashes
- Cherry-pick to new branches

### No Destructive Operations
- No `git reset --hard`
- No force pushes
- No automatic checkouts
- No file overwrites without confirmation

## Files Structure
```
cli/helpers/
├── reflogParser.js      # Reflog scanning and parsing
├── confirmationPrompt.js # Safety confirmation system
├── recoverErrors.js     # Error handling and messages
└── safeBranchOps.js     # Safe Git operations only
```

## Testing
Run `node tests/recovery.test.js` to verify functionality.

## Future Extensions
- Visual diff previews
- Time-based recovery suggestions
- Learning mode with explanations
- Cross-repository recovery
- Semantic commit search