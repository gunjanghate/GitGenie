import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * Error types for Gemini API failures
 */
export const ErrorType = {
    QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
    RATE_LIMIT: 'RATE_LIMIT',
    INVALID_API_KEY: 'INVALID_API_KEY',
    NETWORK_ERROR: 'NETWORK_ERROR',
    GENERIC_API_ERROR: 'GENERIC_API_ERROR',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

/**
 * Parse Gemini API error and return user-friendly information
 * @param {Error} error - The error object from Gemini API
 * @returns {Object} - { type, message, helpfulAction }
 */
export function parseGeminiError(error) {
    const errorMessage = error?.message?.toLowerCase() || '';
    const errorString = error?.toString?.()?.toLowerCase() || '';
    const statusCode = error?.status || error?.statusCode;

    // Detect error type based on patterns
    let errorType = ErrorType.UNKNOWN_ERROR;
    let userMessage = '';
    let helpfulAction = '';

    // Check for quota exceeded errors
    if (
        errorMessage.includes('quota exceeded') ||
        errorMessage.includes('quota_exceeded') ||
        errorMessage.includes('resource_exhausted') ||
        errorMessage.includes('too many requests') ||
        errorString.includes('429')
    ) {
        errorType = ErrorType.QUOTA_EXCEEDED;
        userMessage = 'AI generation failed due to Gemini API quota limit.';
        helpfulAction = `Your free tier quota has been exceeded. Please check your quota at:
   ${chalk.cyan('https://ai.google.dev/gemini-api/docs/rate-limits')}`;
    }
    // Check for rate limit errors
    else if (
        errorMessage.includes('rate limit') ||
        errorMessage.includes('rate_limit') ||
        statusCode === 429
    ) {
        errorType = ErrorType.RATE_LIMIT;
        userMessage = 'AI generation failed due to Gemini API rate limiting.';
        helpfulAction = `You're sending requests too quickly. Please wait a moment and try again.
   ${chalk.cyan('https://ai.google.dev/gemini-api/docs/rate-limits')}`;
    }
    // Check for invalid API key errors
    else if (
        errorMessage.includes('invalid api key') ||
        errorMessage.includes('invalid_api_key') ||
        errorMessage.includes('api key not valid') ||
        errorMessage.includes('authentication') ||
        errorMessage.includes('unauthorized') ||
        statusCode === 401 ||
        statusCode === 403
    ) {
        errorType = ErrorType.INVALID_API_KEY;
        userMessage = 'AI generation failed: Invalid or missing API key.';
        helpfulAction = `Please reconfigure your Gemini API key:
   ${chalk.gray('gg config <your_api_key>')}
   Get your key at: ${chalk.cyan('https://ai.google.dev/gemini-api/docs')}`;
    }
    // Check for network errors
    else if (
        errorMessage.includes('timeout') ||
        errorMessage.includes('etimedout') ||
        errorMessage.includes('econnrefused') ||
        errorMessage.includes('enotfound') ||
        errorMessage.includes('network') ||
        error?.code === 'ETIMEDOUT' ||
        error?.code === 'ECONNREFUSED' ||
        error?.code === 'ENOTFOUND'
    ) {
        errorType = ErrorType.NETWORK_ERROR;
        userMessage = 'AI generation failed due to network timeout.';
        helpfulAction = `Check your internet connection and try again.
   If the issue persists, the Gemini API may be temporarily unavailable.`;
    }
    // Generic API error
    else if (
        errorMessage.includes('api') ||
        errorMessage.includes('generativeai') ||
        errorMessage.includes('google')
    ) {
        errorType = ErrorType.GENERIC_API_ERROR;
        userMessage = 'AI generation failed due to an API error.';
        helpfulAction = `Check your API key and network connection:
   ${chalk.gray('gg config <your_api_key>')}`;
    }
    // Unknown error
    else {
        errorType = ErrorType.UNKNOWN_ERROR;
        userMessage = 'AI generation failed unexpectedly.';
        helpfulAction = `Please check your configuration and try again:
   ${chalk.gray('gg config <your_api_key>')}`;
    }

    return {
        type: errorType,
        message: userMessage,
        helpfulAction: helpfulAction,
        originalError: error
    };
}

/**
 * Display user-friendly error message for Gemini API failures
 * @param {Error} error - The error object from Gemini API
 * @param {string} context - Context string (e.g., 'commit message', 'PR title', 'branch name')
 */
export function displayGeminiError(error, context = 'generation') {
    const { message, helpfulAction } = parseGeminiError(error);

    console.error(chalk.red(`❌ ${message}`));
    console.error(chalk.yellow(`💡 ${helpfulAction}`));
    console.error(chalk.cyan(`   Falling back to manual ${context}.`));

    // Log to debug file if debug mode is enabled
    logErrorToDebugFile(error, context);
}

/**
 * Log detailed error information to debug file (optional)
 * Only logs if GITGENIE_DEBUG environment variable is set
 * @param {Error} error - The error object
 * @param {string} context - Context string
 */
function logErrorToDebugFile(error, context) {
    // Only log if debug mode is enabled
    if (!process.env.GITGENIE_DEBUG) return;

    try {
        const configDir = path.join(os.homedir(), '.gitgenie');
        const logFile = path.join(configDir, 'error.log');

        // Ensure config directory exists
        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true });
        }

        const timestamp = new Date().toISOString();
        const logEntry = `
================================================================================
[${timestamp}] Gemini API Error - ${context}
================================================================================
Error Message: ${error?.message || 'No message'}
Error Name: ${error?.name || 'Unknown'}
Error Code: ${error?.code || 'N/A'}
Status: ${error?.status || error?.statusCode || 'N/A'}
Stack Trace:
${error?.stack || 'No stack trace available'}
================================================================================

`;

        fs.appendFileSync(logFile, logEntry, 'utf8');
    } catch (logError) {
        // Silently fail if logging fails - don't disrupt user experience
    }
}

/**
 * Get a helpful tip about enabling debug mode
 * @returns {string} - Debug mode tip
 */
export function getDebugModeTip() {
    if (process.env.GITGENIE_DEBUG) {
        const logPath = path.join(os.homedir(), '.gitgenie', 'error.log');
        return chalk.gray(`Debug mode enabled. Detailed errors logged to: ${logPath}`);
    }
    return chalk.gray('For detailed error logs, set: GITGENIE_DEBUG=true');
}
