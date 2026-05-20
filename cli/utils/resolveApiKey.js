const BASIC_KEY_REGEX = /^[A-Za-z0-9\-_.=/]+$/;

const PROVIDER_RULES = {
  gemini: { patterns: [/^AIzaSy[A-Za-z0-9\-_.=/]{15,}$/] },
  groq: { patterns: [/^gsk_[A-Za-z0-9\-_.=/]{15,}$/] },
  openai: { patterns: [/^sk-[A-Za-z0-9\-_.=/]{15,}$/] },
  mistral: { patterns: [/^sk-[A-Za-z0-9\-_.=/]{15,}$/] }
};

/**
 * Validates and normalizes an API key for a provider.
 * Returns the trimmed key if it passes validation, otherwise null.
 * 
 * @param {string} provider The name of the provider (e.g. 'gemini', 'openai')
 * @param {string} key The raw API key string
 * @returns {string|null} The normalized key, or null if invalid
 */
export function validateApiKey(provider, key) {
  if (!key || typeof key !== "string") return null;

  const trimmed = key.trim();
  if (trimmed === "") return null;
  if (trimmed.length > 200) return null;
  if (!BASIC_KEY_REGEX.test(trimmed)) return null;

  const normalizedProvider = provider?.toLowerCase();
  const rule = PROVIDER_RULES[normalizedProvider];

  if (rule?.patterns) {
    return rule.patterns.some(regex => regex.test(trimmed)) ? trimmed : null;
  }

  // Stricter fallback for unknown/dynamic providers
  return trimmed.length > 30 ? trimmed : null;
}

/**
 * Gets the raw environment variable key for the specified provider.
 * 
 * @param {string} provider The name of the provider
 * @returns {string|null} The raw environment key value, or null if not found
 */
export function getEnvKey(provider) {
  if (!provider) return null;
  const normalized = provider.toLowerCase();
  const envVar = `${normalized.toUpperCase()}_API_KEY`;
  const value = process.env[envVar];
  return typeof value === "string" ? value : null;
}

/**
 * Resolves, validates, and normalizes the environment-provided API key for a provider.
 * If invalid, prints debug logs and falls back to config.
 * 
 * @param {string} provider The name of the provider
 * @returns {string|null} The validated normalized environment key, or null
 */
export function resolveApiKey(provider) {
  const envKey = getEnvKey(provider);
  if (!envKey) return null;

  const validated = validateApiKey(provider, envKey);
  if (validated) return validated;

  // Traceable fallback logging under debug mode
  if (process.env.GITGENIE_DEBUG === "true") {
    console.log(`[DEBUG] Invalid ENV API key detected for ${provider}, falling back`);
  }
  return null;
}
