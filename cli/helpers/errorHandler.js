import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * Local providers that run on-device — no API keys, different error surface.
 */
const LOCAL_PROVIDERS = ['ollama', 'lmstudio'];

/** Display names for local providers */
const LOCAL_PROVIDER_NAMES = {
    ollama: 'Ollama',
    lmstudio: 'LM Studio',
};

/** Setup hints for local providers */
const LOCAL_PROVIDER_HINTS = {
    ollama: {
        serverHint: 'Start the server with: ollama serve',
        modelHint: (model) => `Pull the model with: ollama pull ${model}`,
        configHint: 'Reconfigure with: gg config --provider ollama --url <url> --model <model>',
        docsUrl: 'https://ollama.com/library',
    },
    lmstudio: {
        serverHint: 'Open LM Studio → load a model → enable the local server (port 1234)',
        modelHint: (_model) => 'Make sure a model is loaded and the server is enabled in LM Studio',
        configHint: 'Reconfigure with: gg config --provider lmstudio --url <url> --model <model>',
        docsUrl: 'https://lmstudio.ai/docs',
    },
};

/**
 * Parse errors from local AI providers (Ollama, LM Studio).
 * These have no API keys — errors are about server reachability and model availability.
 * @param {Error} error
 * @param {string} providerName - 'ollama' | 'lmstudio'
 * @returns {Object} { type, message, helpfulAction }
 */
function parseLocalProviderError(error, providerName) {
    const msg = error?.message || '';
    const msgLow = msg.toLowerCase();
    const hints = LOCAL_PROVIDER_HINTS[providerName] || LOCAL_PROVIDER_HINTS.ollama;
    const displayName = LOCAL_PROVIDER_NAMES[providerName] || providerName;

    // Context window overflow (e.g. LM Studio HTTP 400 "Cannot truncate prompt")
    if (
        msgLow.includes('n_ctx') ||
        msgLow.includes('context') ||
        msgLow.includes('truncate prompt') ||
        msgLow.includes('context length') ||
        (error?.status === 400 || msgLow.includes('http 400'))
    ) {
        return {
            type: ErrorType.GENERIC_API_ERROR,
            message: `${displayName}: the diff is too large for this model's context window.`,
            helpfulAction:
                `Try loading a model with a larger context window in ${displayName}.\n` +
                `   Or stage fewer files at a time before committing.\n` +
                `   ${chalk.gray(hints.configHint)}`,
        };
    }

    // Server not reachable (thrown by our #ensureRunning guard)
    if (
        msgLow.includes('not reachable') ||
        msgLow.includes('econnrefused') ||
        msgLow.includes('etimedout') ||
        msgLow.includes('timeout') ||
        msgLow.includes('enotfound') ||
        msgLow.includes('network') ||
        error?.code === 'ECONNREFUSED' ||
        error?.code === 'ETIMEDOUT' ||
        error?.code === 'ENOTFOUND'
    ) {
        return {
            type: ErrorType.NETWORK_ERROR,
            message: `${displayName} server is not running or not reachable.`,
            helpfulAction:
                `${hints.serverHint}\n` +
                `   ${chalk.gray(hints.configHint)}`,
        };
    }

    // Model not found / not loaded (thrown by our #chat guard)
    if (
        msgLow.includes('not found') ||
        msgLow.includes('not loaded') ||
        msgLow.includes('model') ||
        (error?.status === 404)
    ) {
        // Try to extract model name from the error message
        const modelMatch = msg.match(/["\u201c]([^"\u201d]+)["\u201d]/);
        const modelName = modelMatch ? modelMatch[1] : 'the configured model';
        return {
            type: ErrorType.GENERIC_API_ERROR,
            message: `${displayName}: model "${modelName}" is not available.`,
            helpfulAction:
                `${hints.modelHint(modelName)}\n` +
                `   ${chalk.gray(hints.configHint)}`,
        };
    }

    // Generic local error
    return {
        type: ErrorType.UNKNOWN_ERROR,
        message: `${displayName} returned an unexpected error.`,
        helpfulAction:
            `Check that ${displayName} is running and the model is loaded.\n` +
            `   ${chalk.gray(hints.configHint)}\n` +
            `   Docs: ${chalk.cyan(hints.docsUrl)}`,
    };
}

/**
 * Error types for AI provider API failures
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
 * Get provider-specific error patterns
 * @param {string} providerName - Provider name (gemini, mistral, groq)
 * @returns {Object} Error patterns for the provider
 */
function getProviderErrorPatterns(providerName) {
    const patterns = {
        gemini: {
            quotaExceeded: ['quota exceeded', 'quota_exceeded', 'resource_exhausted', 'too many requests', '429'],
            rateLimit: ['rate limit', 'rate_limit'],
            invalidKey: ['invalid api key', 'invalid_api_key', 'api key not valid', 'authentication', 'unauthorized'],
            docsUrl: 'https://ai.google.dev/gemini-api/docs',
            rateLimitUrl: 'https://ai.google.dev/gemini-api/docs/rate-limits'
        },
        mistral: {
            quotaExceeded: ['quota exceeded', 'resource_exhausted', 'too many requests', '429'],
            rateLimit: ['rate limit', 'rate_limit'],
            invalidKey: ['invalid api key', 'invalid_api_key', 'authentication failed', 'unauthorized'],
            docsUrl: 'https://docs.mistral.ai/',
            rateLimitUrl: 'https://docs.mistral.ai/api/#rate-limiting'
        },
        groq: {
            quotaExceeded: ['quota exceeded', 'resource_exhausted', 'too many requests', '429'],
            rateLimit: ['rate limit', 'rate_limit', 'rate_limit_exceeded'],
            invalidKey: ['invalid api key', 'invalid_api_key', 'authentication failed', 'unauthorized', 'invalid_request_error'],
            docsUrl: 'https://console.groq.com/docs',
            rateLimitUrl: 'https://console.groq.com/docs/rate-limits'
        }
    };

    return patterns[providerName] || patterns.gemini;
}

/**
 * Parse AI provider API error and return user-friendly information
 * @param {Error} error - The error object from AI provider API
 * @param {string} providerName - Provider name (gemini, mistral, etc.)
 * @returns {Object} - { type, message, helpfulAction }
 */
export function parseProviderError(error, providerName = 'gemini') {
    // Local providers have a completely different error surface — no API keys involved
    if (LOCAL_PROVIDERS.includes(providerName.toLowerCase())) {
        return parseLocalProviderError(error, providerName.toLowerCase());
    }

    const errorMessage = error?.message?.toLowerCase() || '';
    const errorString = error?.toString?.()?.toLowerCase() || '';
    const statusCode = error?.status || error?.statusCode;
    const patterns = getProviderErrorPatterns(providerName);
    const providerDisplayName = providerName.charAt(0).toUpperCase() + providerName.slice(1);

    // Detect error type based on patterns
    let errorType = ErrorType.UNKNOWN_ERROR;
    let userMessage = '';
    let helpfulAction = '';

    // Check for quota exceeded errors
    const hasQuotaError = patterns.quotaExceeded.some(pattern =>
        errorMessage.includes(pattern) || errorString.includes(pattern)
    );

    if (hasQuotaError) {
        errorType = ErrorType.QUOTA_EXCEEDED;
        userMessage = `AI generation failed due to ${providerDisplayName} API quota limit.`;
        helpfulAction = `Your free tier quota has been exceeded. Please check your quota at:
   ${chalk.cyan(patterns.rateLimitUrl)}`;
    }
    // Check for rate limit errors
    else if (
        patterns.rateLimit.some(pattern => errorMessage.includes(pattern)) ||
        statusCode === 429
    ) {
        errorType = ErrorType.RATE_LIMIT;
        userMessage = `AI generation failed due to ${providerDisplayName} API rate limiting.`;
        helpfulAction = `You're sending requests too quickly. Please wait a moment and try again.
   ${chalk.cyan(patterns.rateLimitUrl)}`;
    }
    // Check for invalid API key errors
    else if (
        patterns.invalidKey.some(pattern => errorMessage.includes(pattern)) ||
        statusCode === 401 ||
        statusCode === 403
    ) {
        errorType = ErrorType.INVALID_API_KEY;
        userMessage = 'AI generation failed: Invalid or missing API key.';
        helpfulAction = `Please reconfigure your ${providerDisplayName} API key:
   ${chalk.gray(`gg config <your_api_key> --provider ${providerName}`)}
   Get your key at: ${chalk.cyan(patterns.docsUrl)}`;
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
   If the issue persists, the ${providerDisplayName} API may be temporarily unavailable.`;
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
   ${chalk.gray(`gg config <your_api_key> --provider ${providerName}`)}`;
    }
    // Unknown error
    else {
        errorType = ErrorType.UNKNOWN_ERROR;
        userMessage = 'AI generation failed unexpectedly.';
        helpfulAction = `Please check your configuration and try again:
   ${chalk.gray(`gg config <your_api_key> --provider ${providerName}`)}`;
    }

    return {
        type: errorType,
        message: userMessage,
        helpfulAction: helpfulAction,
        originalError: error
    };
}

/**
 * Display user-friendly error message for AI provider API failures
 * @param {Error} error - The error object from AI provider API
 * @param {string} providerName - Provider name (gemini, mistral, etc.)
 * @param {string} context - Context string (e.g., 'commit message', 'PR title', 'branch name')
 */
export function displayProviderError(error, providerName = 'gemini', context = 'generation') {
    const { message, helpfulAction } = parseProviderError(error, providerName);

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
        const providerDisplayName = providerName || 'AI Provider';
        const logEntry = `
================================================================================
[${timestamp}] ${providerDisplayName} API Error - ${context}
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

// Backward compatibility exports (for legacy code)
export function parseGeminiError(error) {
    return parseProviderError(error, 'gemini');
}

export function displayGeminiError(error, context = 'generation') {
    return displayProviderError(error, 'gemini', context);
}
