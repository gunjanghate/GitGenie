# Context-Aware Command Suggestions - Live Demo

## Feature Overview

GitGenie now detects your git repository state and provides intelligent command suggestions that match your current context.

## Demo 1: Merge Conflict State

### Setup

```bash
git checkout feature
echo "conflict from feature" > file.txt
git add . && git commit -m "edit file in feature"
git checkout main
echo "conflict from main" > file.txt
git add . && git commit -m "edit file in main"
git merge feature
```

### Result

```bash
Auto-merging file.txt
CONFLICT (content): Merge conflict in file.txt
Automatic merge failed; fix conflicts and then commit the result.
```

### GitGenie Suggestions

```bash
gg rx

❌ Unknown command: "rx"

  Did you mean: gg recover?
  (merge conflict detected - use 'recover' to restore a clean state)
  Or try:       gg undo
  (merge conflict detected - use 'undo' to roll back the merge)

  Repo state: ⚡ Merge in progress

  Run "gg --help" to list all commands
```

**What's happening:**

- GitGenie detects `.git/MERGE_HEAD` file indicating active merge
- Prioritizes `recover` and `undo` commands as most relevant
- Shows context reason for each suggestion
- Displays current repository state

---

## Demo 2: Staged Changes Detection

### Setup

```bash
echo "new feature" > feature.ts
git add feature.ts
git status
```

### GitGenie Suggestions

```bash
gg c

❌ Unknown command: "c"

  Did you mean: gg commit?
  (staged changes detected - commit them with 'commit')

  Run "gg --help" to list all commands
```

**What's happening:**

- Detects staged files via `git status --porcelain` output
- Suggests `commit` command as primary action for staged changes
- No repository state banner for staged-only changes (only shows for merge/rebase/cherry-pick/detached states)

---

## Demo 3: Detached HEAD State

### Setup

```bash
git checkout abc1234def
```

### GitGenie Suggestions

```bash
gg ch

❌ Unknown command: "ch"

  Did you mean: gg b?
  (detached HEAD state - create a branch first with 'b')
  Or try:       gg recover
  (detached HEAD state - use 'recover' if you need to get back)

  Repo state: ⚠ Detached HEAD state

  Run "gg --help" to list all commands
```

**What's happening:**

- Detects detached HEAD when `git symbolic-ref --short HEAD` fails
- Prioritizes `b` command (branch creation) to fix the state
- Offers `recover` as alternative for complex situations
- Shows detached HEAD state in status banner

---

## Technical Implementation

### Secure Git Detection

- Uses `fs.existsSync()` and `path.join()` for `.git` state files
- Calls `execFileSync('git', [...])` with argument arrays (no shell injection)
- Cross-platform safe (works on Windows, macOS, Linux)

### Files Modified

1. `cli/helpers/commandSuggestions.js` - Context detection and ranking
2. `cli/index.js` - Dynamic import of suggestion handler

### Testing

```bash
npm test
```

All tests passing - verifies feature works correctly

---

## Key Features

✅ Real-time git state detection  
✅ Intelligent command ranking  
✅ Per-suggestion context explanation  
✅ Secure implementation (no shell injection)  
✅ Cross-platform compatible  
✅ No external dependencies

---

## How to Test Locally

1. Clone the repository
2. Run `npm install`
3. Create a git repository with merge conflict:
   ```bash
   mkdir test-repo && cd test-repo && git init
   git config user.email "test@example.com"
   git config user.name "Test"
   ```
4. Create merge conflict scenario (see Demo 1 above)
5. Run GitGenie: `node ../cli/index.js unknownCommand`
6. Observe context-aware suggestions
