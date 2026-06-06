import simpleGit from 'simple-git';
import chalk from 'chalk';

const MAX_DIFF_LENGTH = 5000;
const MAX_TOTAL_DIFF_SIZE = 30000;

const IGNORED_PATTERNS = [
    'package-lock.json',
    'pnpm-lock.yaml',
    'yarn.lock',
    'dist/',
    'build/',
    '.next/',
    'coverage/'
];

function shouldIgnoreFile(filePath) {
    return IGNORED_PATTERNS.some(pattern =>
        filePath.includes(pattern)
    );
}

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

        let totalDiffSize = 0;

        for (const file of stagedFiles) {

            // Skip noisy/generated files
            if (shouldIgnoreFile(file)) {
                continue;
            }

            try {
                const diff = await git.diff(['--cached', file]);

                // Truncate oversized diffs
                const safeDiff =
                    diff.length > MAX_DIFF_LENGTH
                        ? diff.slice(0, MAX_DIFF_LENGTH) +
                          '\n... [Diff truncated due to size]'
                        : diff;

                totalDiffSize += safeDiff.length;

                // Prevent excessive total diff processing
                if (totalDiffSize > MAX_TOTAL_DIFF_SIZE) {

                    diffs[file] =
                        '[Skipped: total staged diff size exceeded safe processing limit]';

                    files.push({
                        path: file,
                        status: 'truncated'
                    });

                    break; // Stop processing further diffs
                }

                diffs[file] = safeDiff || '';

                // Determine status
                let fileStatus = 'modified';

                if (status.created.includes(file)) {
                    fileStatus = 'added';
                }

                if (status.deleted.includes(file)) {
                    fileStatus = 'deleted';
                }

                if (status.renamed.some(r => (r.to || r) === file)) {
                    fileStatus = 'renamed';
                }

                files.push({
                    path: file,
                    status: fileStatus
                });

            } catch (err) {

                // Graceful fallback if diff fails
                diffs[file] = '[Unable to load diff]';

                files.push({
                    path: file,
                    status: 'unknown'
                });
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
 * @param {AIProvider} provider - AI provider instance
 * @param {number} maxGroups - Maximum number of groups to create
 * @returns {Promise<Array>} Array of group objects
 */
export async function groupFilesWithAI(filesData, provider, maxGroups = 5) {
    if (!provider) {
        throw new Error('Provider instance is required for AI grouping');
    }

    return await provider.groupFilesWithAI(filesData, maxGroups);
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
        const allDirs = Object.keys(sourceByDir);

        if (allDirs.length === 1 || remainingSlots === 1) {
            // All source files in one group
            groups.push({
                files: filesByCategory.source.map(f => f.path),
                type: 'feat',
                scope: '',
                description: 'update source files',
                rationale: 'Source code files grouped together'
            });
        } else {
            const excessDirs = allDirs.slice(remainingSlots); // fix: was (remainingSlots - 1) — off-by-one caused wasteful merge
            // Group by directory
            allDirs.slice(0, remainingSlots).forEach( // fix: was remainingSlots - 1dir => { // Only iterate over dirs that will get their own group
                groups.push({
                    files: sourceByDir[dir].map(f => f.path),
                    type: 'feat',
                    scope: dir === '.' ? '' : dir,
                    description: `update ${dir} files`,
                    rationale: `Files in ${dir} directory grouped together`
                });
            });
            // Merge remaining directories into one group
            if (excessDirs.length > 0) {
                const excessFiles = excessDirs.flatMap(dir => sourceByDir[dir].map(f => f.path));
                groups.push({
                    files: excessFiles,
                    type: 'feat',
                    scope: '',
                    description: 'update remaining source files',
                    rationale: `Files from ${excessDirs.length} directories grouped together`
                });
            }
        }
    }

    return groups;
}

/**
 * Generate commit message for a specific group
 * @param {Object} group - Group object with files, type, scope, description
 * @param {Object} filesData - Original files data with diffs
 * @param {AIProvider} provider - Optional AI provider instance for AI generation
 * @returns {Promise<string>} Commit message
 */
export async function generateCommitMessageForGroup(group, filesData, provider = null) {
    // Manual fallback format
    const manualMessage = `${group.type}${group.scope ? `(${group.scope})` : ''}: ${group.description}`;

    if (!provider) {
        return manualMessage;
    }

    try {
        return await provider.generateCommitMessageForGroup(group, filesData);
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

