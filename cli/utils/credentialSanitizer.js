/**
 * credentialSanitizer.js
 *
 * Utility functions to prevent accidental exposure of credentials
 * (tokens, passwords, API keys) in console output, error messages, and logs.
 *
 * Addresses: https://github.com/gunjanghate/GitGenie/issues/173
 *
 * Credentials can appear in:
 *  - Git remote URLs: https://<token>@github.com/...
 *                     https://<user>:<password>@github.com/...
 *  - Error messages from simple-git / child_process that echo the URL
 *  - Debug log entries
 */

/**
 * Regex that matches the user-info portion of a URL
 * (everything between "://" and the "@" sign before the hostname).
 *
 * Covers:
 *   https://token@host              → https://<redacted>@host
 *   https://user:password@host      → https://<redacted>@host
 *   http://user:pass@host:port/path → http://<redacted>@host:port/path
 */
const CREDENTIAL_URL_REGEX = /([a-zA-Z][a-zA-Z0-9+\-.]*:\/\/)([^@\s/]+@)/g;

/**
 * Replaces the userinfo segment of any URL in the given string with
 * the placeholder "[credentials-redacted]".
 *
 * @param {string} input - Any string that may contain URLs with embedded credentials.
 * @returns {string} The sanitized string with credentials replaced.
 */
export function sanitizeCredentials(input) {
  if (typeof input !== 'string') return input;
  return input.replace(CREDENTIAL_URL_REGEX, '$1[credentials-redacted]@');
}

/**
 * Sanitizes an Error object's message in-place (non-destructive copy).
 * Returns a plain object with the sanitized message so that the original
 * error is never mutated.
 *
 * @param {Error|unknown} error - The error to sanitize.
 * @returns {{ message: string, stack?: string }} A sanitized error-like object.
 */
export function sanitizeError(error) {
  if (!error) return { message: 'Unknown error' };

  const message = sanitizeCredentials(
    typeof error.message === 'string' ? error.message : String(error)
  );

  const stack = error.stack
    ? sanitizeCredentials(error.stack)
    : undefined;

  return { ...error, message, stack };
}

/**
 * Extracts a display-safe version of a remote URL.
 * Strips userinfo but preserves the rest of the URL for diagnostic purposes.
 *
 * @param {string} url - The raw remote URL (may include credentials).
 * @returns {string} The URL with credentials redacted.
 *
 * @example
 * sanitizeRemoteUrl('https://ghp_abc123@github.com/user/repo.git')
 * // → 'https://[credentials-redacted]@github.com/user/repo.git'
 */
export function sanitizeRemoteUrl(url) {
  return sanitizeCredentials(url);
}
