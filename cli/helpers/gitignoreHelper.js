/**
 * GitIgnore Helper Module
 * 
 * Provides utilities for managing .gitignore files, including:
 * - Appending patterns to .gitignore
 * - Checking for duplicate patterns
 * - Validating pattern format
 * - Determining correct .gitignore path (local or global)
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * Get the path to the .gitignore file
 * @param {boolean} isGlobal - Whether to use global gitignore
 * @returns {string} Path to .gitignore file
 */
export function getGitignorePath(isGlobal = false) {
    if (isGlobal) {
        return path.join(os.homedir(), '.gitignore_global');
    }
    return path.join(process.cwd(), '.gitignore');
}

/**
 * Validate a gitignore pattern
 * @param {string} pattern - Pattern to validate
 * @returns {Object} { valid: boolean, error: string|null }
 */
export function validatePattern(pattern) {
    // Check if pattern is empty or only whitespace
    if (!pattern || typeof pattern !== 'string' || pattern.trim().length === 0) {
        return { valid: false, error: 'Pattern cannot be empty' };
    }

    // Check for newline characters (security: prevent multi-line injection)
    if (pattern.includes('\n') || pattern.includes('\r')) {
        return { valid: false, error: 'Pattern must be a single line' };
    }

    // Check for reasonable length (most gitignore patterns are under 200 chars)
    if (pattern.length > 500) {
        return { valid: false, error: 'Pattern is too long (max 500 characters)' };
    }

    // Check for null bytes (security concern)
    if (pattern.includes('\0')) {
        return { valid: false, error: 'Pattern contains invalid null byte' };
    }

    return { valid: true, error: null };
}

/**
 * Check if a pattern already exists in .gitignore
 * @param {string} filePath - Path to .gitignore file
 * @param {string} pattern - Pattern to check
 * @returns {boolean} True if pattern exists
 */
export function checkPatternExists(filePath, pattern) {
    if (!fs.existsSync(filePath)) {
        return false;
    }

    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');

        // Trim the pattern for comparison
        const trimmedPattern = pattern.trim();

        // Check if any line matches the pattern (case-sensitive)
        return lines.some(line => line.trim() === trimmedPattern);
    } catch (err) {
        // If we can't read the file, assume pattern doesn't exist
        return false;
    }
}

/**
 * Append a pattern to .gitignore
 * @param {string} pattern - Pattern to append
 * @param {Object} options - Options object
 * @param {boolean} options.global - Use global gitignore
 * @param {string} options.comment - Optional comment to add above pattern
 * @returns {Object} { success: boolean, message: string, filePath: string }
 */
export function appendToGitignore(pattern, options = {}) {
    const { global: isGlobal = false, comment = null } = options;

    // Validate pattern
    const validation = validatePattern(pattern);
    if (!validation.valid) {
        return {
            success: false,
            message: validation.error,
            filePath: null
        };
    }

    // Get file path
    const filePath = getGitignorePath(isGlobal);
    const trimmedPattern = pattern.trim();

    // Check for duplicates
    if (checkPatternExists(filePath, trimmedPattern)) {
        return {
            success: false,
            message: `Pattern "${trimmedPattern}" already exists in ${path.basename(filePath)}`,
            filePath
        };
    }

    try {
        let contentToAppend = '';

        // Check if file exists and doesn't end with newline
        if (fs.existsSync(filePath)) {
            const existingContent = fs.readFileSync(filePath, 'utf-8');
            if (existingContent.length > 0 && !existingContent.endsWith('\n')) {
                contentToAppend = '\n';
            }
        }

        // Add comment if provided
        if (comment) {
            contentToAppend += `# ${comment}\n`;
        }

        // Add pattern
        contentToAppend += `${trimmedPattern}\n`;

        // Append to file (creates file if it doesn't exist)
        fs.appendFileSync(filePath, contentToAppend, 'utf-8');

        return {
            success: true,
            message: `Added "${trimmedPattern}" to ${path.basename(filePath)}`,
            filePath
        };
    } catch (err) {
        return {
            success: false,
            message: `Failed to write to ${path.basename(filePath)}: ${err.message}`,
            filePath
        };
    }
}
