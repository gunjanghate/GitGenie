import simpleGit from 'simple-git';
import { GoogleGenerativeAI } from '@google/generative-ai';
import chalk from 'chalk';
import ora from 'ora';

const git = simpleGit();

/**
 * Analyze all staged changes and return structured data
 * @returns {Promise<Object>} { files: Array<{path, status}>, diffs: Object }
 */
export async function analyzeStagedChanges() {
    try {
        // Get list of staged files with their status
        const status = await git.status();

        // Collect all unique staged files using Set to avoid duplicates
        const stagedFilesSet = new Set([
            ...status.staged,
            ...status.created,
            ...status.renamed.map(r => r.to || r)
        ]);

        const stagedFiles = Array.from(stagedFilesSet);

        if (stagedFiles.length === 0) {
            return { files: [], diffs: {} };
        }

        // Get diff for each staged file
        const diffs = {};
        const files = [];

        for (const file of stagedFiles) {
            try {
                const diff = await git.diff(['--cached', file]);
                diffs[file] = diff || '';

                // Determine status
                let fileStatus = 'modified';
                if (status.created.includes(file)) fileStatus = 'added';
                if (status.deleted.includes(file)) fileStatus = 'deleted';

                files.push({ path: file, status: fileStatus });
            } catch (err) {
                // If diff fails for a file, include it anyway
                diffs[file] = '';
                files.push({ path: file, status: 'unknown' });
            }
        }

        return { files, diffs };
    } catch (err) {
        throw new Error(`Failed to analyze staged changes: ${err.message}`);
    }
}

/**
 * Group files using AI-powered analysis
 * @param {Object} filesData - { files, diffs } from analyzeStagedChanges
 * @param {string} apiKey - Gemini API key
 * @param {number} maxGroups - Maximum number of groups to create
 * @returns {Promise<Array>} Array of group objects
 */
export async function groupFilesWithAI(filesData, apiKey, maxGroups = 5) {
    if (!apiKey) {
        throw new Error('API key is required for AI grouping');
    }

    const spinner = ora('🧞 Analyzing changes with AI...').start();

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        // Prepare file summary for AI (limit diff size to avoid token limits)
        const fileSummary = filesData.files.map(f => {
            const diff = filesData.diffs[f.path] || '';
            const truncatedDiff = diff.length > 500 ? diff.substring(0, 500) + '\n... (truncated)' : diff;
            return {
                path: f.path,
                status: f.status,
                diff: truncatedDiff
            };
        });

        const prompt = `You are a senior software engineer analyzing git changes to create logical, atomic commits.

TASK: Analyze the following staged files and group them into separate commits based on semantic relationships.

RULES:
1. Each group should represent ONE logical change (feature, fix, refactor, etc.)
2. Related files should be grouped together (e.g., component + test + styles)
3. Unrelated changes should be in separate groups
4. Maximum ${maxGroups} groups
5. Each group must have a clear purpose
6. Follow Conventional Commits specification for types

FILES AND CHANGES:
${JSON.stringify(fileSummary, null, 2)}

Return a JSON array of groups with this structure:
[
  {
    "files": ["path/to/file1.js", "path/to/file2.test.js"],
    "type": "feat|fix|docs|style|refactor|test|chore|ci|build|perf",
    "scope": "component/module name (optional)",
    "description": "brief description of this group's changes",
    "rationale": "why these files belong together"
  }
]

IMPORTANT: 
- Every file must be assigned to exactly one group
- Groups should be ordered by importance (most significant first)
- Return ONLY valid JSON, no explanations or markdown code blocks
- If scope is not applicable, use empty string ""`;

        // Set timeout for AI request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds

        const result = await model.generateContent(prompt);
        clearTimeout(timeoutId);

        spinner.succeed('✓ AI analysis complete');

        const responseText = result.response?.text()?.trim() || '';

        // Try to extract JSON from response (handle markdown code blocks)
        let jsonText = responseText;
        const jsonMatch = responseText.match(/```(?:json)?\s*(\[[\s\S]*\])\s*```/);
        if (jsonMatch) {
            jsonText = jsonMatch[1];
        }

        const groups = JSON.parse(jsonText);

        // Validate groups structure
        if (!Array.isArray(groups)) {
            throw new Error('AI response is not an array');
        }

        // Ensure all required fields exist
        groups.forEach((group, idx) => {
            if (!group.files || !Array.isArray(group.files)) {
                throw new Error(`Group ${idx} missing files array`);
            }
            if (!group.type) group.type = 'chore';
            if (!group.scope) group.scope = '';
            if (!group.description) group.description = 'changes';
            if (!group.rationale) group.rationale = '';
        });

        return groups;
    } catch (err) {
        spinner.fail('AI analysis failed');

        // Check for specific error types
        if (err.name === 'AbortError') {
            throw new Error('Network timeout: AI request took too long');
        }

        if (err instanceof SyntaxError) {
            throw new Error('Failed to parse AI response as JSON');
        }

        throw err;
    }
}

/**
 * Group files using heuristic rules (fallback when AI unavailable)
 * @param {Object} filesData - { files, diffs } from analyzeStagedChanges
 * @param {number} maxGroups - Maximum number of groups to create
 * @returns {Array} Array of group objects
 */
export function groupFilesHeuristic(filesData, maxGroups = 5) {
    const groups = [];
    const filesByCategory = {
        docs: [],
        tests: [],
        config: [],
        styles: [],
        source: []
    };

    // Categorize files
    filesData.files.forEach(file => {
        const path = file.path.toLowerCase();

        if (path.match(/\.(md|txt|rst|adoc)$/)) {
            filesByCategory.docs.push(file);
        } else if (path.match(/\.(test|spec)\.|__tests__|test_/)) {
            filesByCategory.tests.push(file);
        } else if (path.match(/package\.json|\.lock|\.config\.|\.env|tsconfig|webpack|vite|rollup/)) {
            filesByCategory.config.push(file);
        } else if (path.match(/\.(css|scss|sass|less|styl)$/)) {
            filesByCategory.styles.push(file);
        } else {
            filesByCategory.source.push(file);
        }
    });

    // Create groups from categories
    if (filesByCategory.docs.length > 0) {
        groups.push({
            files: filesByCategory.docs.map(f => f.path),
            type: 'docs',
            scope: '',
            description: 'update documentation',
            rationale: 'Documentation files grouped together'
        });
    }

    if (filesByCategory.tests.length > 0) {
        groups.push({
            files: filesByCategory.tests.map(f => f.path),
            type: 'test',
            scope: '',
            description: 'add/update tests',
            rationale: 'Test files grouped together'
        });
    }

    if (filesByCategory.config.length > 0) {
        groups.push({
            files: filesByCategory.config.map(f => f.path),
            type: 'chore',
            scope: '',
            description: 'update configuration',
            rationale: 'Configuration files grouped together'
        });
    }

    if (filesByCategory.styles.length > 0) {
        groups.push({
            files: filesByCategory.styles.map(f => f.path),
            type: 'style',
            scope: '',
            description: 'update styles',
            rationale: 'Style files grouped together'
        });
    }

    if (filesByCategory.source.length > 0) {
        // Further group source files by directory
        const sourceByDir = {};
        filesByCategory.source.forEach(file => {
            const dir = file.path.includes('/') ? file.path.split('/')[0] : '.';
            if (!sourceByDir[dir]) sourceByDir[dir] = [];
            sourceByDir[dir].push(file);
        });

        // Create groups for each directory (up to remaining maxGroups slots)
        const remainingSlots = maxGroups - groups.length;
        const dirs = Object.keys(sourceByDir).slice(0, remainingSlots);

        if (dirs.length === 1 || remainingSlots === 1) {
            // All source files in one group
            groups.push({
                files: filesByCategory.source.map(f => f.path),
                type: 'feat',
                scope: '',
                description: 'update source files',
                rationale: 'Source code files grouped together'
            });
        } else {
            // Group by directory
            dirs.forEach(dir => {
                groups.push({
                    files: sourceByDir[dir].map(f => f.path),
                    type: 'feat',
                    scope: dir === '.' ? '' : dir,
                    description: `update ${dir} files`,
                    rationale: `Files in ${dir} directory grouped together`
                });
            });
        }
    }

    return groups;
}

/**
 * Generate commit message for a specific group
 * @param {Object} group - Group object with files, type, scope, description
 * @param {Object} filesData - Original files data with diffs
 * @param {string} apiKey - Optional Gemini API key for AI generation
 * @returns {Promise<string>} Commit message
 */
export async function generateCommitMessageForGroup(group, filesData, apiKey = null) {
    // Manual fallback format
    const manualMessage = `${group.type}${group.scope ? `(${group.scope})` : ''}: ${group.description}`;

    if (!apiKey) {
        return manualMessage;
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5flash' });

        // Get diffs for files in this group
        const groupDiffs = group.files
            .map(file => {
                const diff = filesData.diffs[file] || '';
                const truncated = diff.length > 300 ? diff.substring(0, 300) + '\n... (truncated)' : diff;
                return `File: ${file}\n${truncated}`;
            })
            .join('\n---\n');

        const prompt = `You are a senior software engineer creating a git commit message.

Generate a professional commit message following Conventional Commits specification.

REQUIREMENTS:
- Format: type(scope): description
- Description under 50 characters
- Imperative mood (add, fix, update)
- Lowercase description
- No period at end
- Type: ${group.type}
${group.scope ? `- Scope: ${group.scope}` : ''}

FILES IN THIS COMMIT:
${group.files.join('\n')}

CHANGES:
${groupDiffs}

CONTEXT: ${group.description}

Return ONLY the commit message, no quotes or explanations.`;

        const result = await model.generateContent(prompt);
        const message = result.response?.text()?.trim() || manualMessage;

        // Validate format
        if (message.length > 72 || !message.includes(':')) {
            return manualMessage;
        }

        return message;
    } catch (err) {
        // Silently fall back to manual message
        return manualMessage;
    }
}

/**
 * Validate groups to ensure all files are assigned and no duplicates
 * @param {Array} groups - Array of group objects
 * @param {Object} filesData - Original files data
 * @returns {Array|null} Array of validation errors or null if valid
 */
export function validateGroups(groups, filesData) {
    const errors = [];
    const assignedFiles = new Set();
    const allFiles = new Set(filesData.files.map(f => f.path));

    // Check each group
    groups.forEach((group, idx) => {
        if (!group.files || group.files.length === 0) {
            errors.push(`Group ${idx + 1} has no files`);
        }

        // Check for duplicate assignments
        group.files.forEach(file => {
            if (assignedFiles.has(file)) {
                errors.push(`File "${file}" is assigned to multiple groups`);
            }
            assignedFiles.add(file);
        });
    });

    // Check if all files are assigned
    allFiles.forEach(file => {
        if (!assignedFiles.has(file)) {
            errors.push(`File "${file}" is not assigned to any group`);
        }
    });

    return errors.length > 0 ? errors : null;
}

/**
 * Display formatted preview of groups
 * @param {Array} groups - Array of group objects
 * @returns {string} Formatted preview string
 */
export function displayGroupPreview(groups) {
    let output = chalk.cyan.bold('\n📋 Detected Groups:\n');

    groups.forEach((group, idx) => {
        output += '\n' + chalk.gray('─'.repeat(60)) + '\n';
        output += chalk.yellow.bold(`[Group ${idx + 1}] `) +
            chalk.green(`${group.type}${group.scope ? `(${group.scope})` : ''}: ${group.description}\n`);

        output += chalk.gray(`Files (${group.files.length}):\n`);
        group.files.forEach(file => {
            output += chalk.white(`  • ${file}\n`);
        });

        if (group.rationale) {
            output += chalk.gray(`Rationale: ${group.rationale}\n`);
        }
    });

    output += '\n' + chalk.gray('─'.repeat(60)) + '\n';

    return output;
}

