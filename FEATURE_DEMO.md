# Context-Aware Command Suggestions - Live Demo

## Feature Overview
GitGenie now detects your git repository state and provides intelligent command suggestions that match your current context.

## Demo 1: Merge Conflict State

### Setup
```bash
$ git checkout feature
$ echo "conflict from feature" > file.txt  
$ git add . && git commit -m "edit file in feature"
$ git checkout main
$ echo "conflict from main" > file.txt
$ git add . && git commit -m "edit file in main"
$ git merge feature
```

### Result
```
Auto-merging file.txt
CONFLICT (content): Merge conflict in file.txt
Automatic merge failed; fix conflicts and then commit the result.
```

### GitGenie Suggestions
```
$ gg rx
Unknown command "rx"
Did you mean: gg recover?
(merge conflict detected - use 'recover' to restore clean state)
Or try:       gg undo
(merge conflict detected - use 'undo' to roll back merge)

Repo state: Merge in progress
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
$ echo "new feature" > feature.ts
$ git add feature.ts
$ git status
```

### GitGenie Suggestions
```
$ gg c
Unknown command "c"
Did you mean: gg commit?
(staged changes detected - commit them with 'commit')
Or try:       gg status
(see current state with 'status')

Repo state: Staged changes pending
```

**What's happening:**
- Detects staged files via `git status` output
- Suggests `commit` command as primary action
- References actual registered commands (not shortcuts)

---

## Demo 3: Detached HEAD State

### Setup
```bash
$ git checkout abc1234def
Note: checking out 'abc1234def'.
You are in 'detached HEAD' state.
```

### GitGenie Suggestions
```
$ gg ch
Unknown command "ch"
Did you mean: gg branch?
(detached HEAD state - create branch first with 'branch')
Or try:       gg checkout
(detached HEAD state - switch to branch with 'checkout')

Repo state: Detached HEAD
```

**What's happening:**
- Reads `.git/HEAD` file to detect detached state
- Prioritizes `branch` command to fix the state
- Explains why command is suggested

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
$ npm test
# All tests passing - verifies feature works correctly
```

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

