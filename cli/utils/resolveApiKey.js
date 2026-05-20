const BASIC_KEY_REGEX = /^[A-Za-z0-9\-_.=/]+$/;

const PROVIDER_RULES = {
  gemini: { patterns: [/^AIzaSy[A-Za-z0-9\-_.=/]{15,}$/] },
  groq: { patterns: [/^gsk_[A-Za-z0-9\-_.=/]{15,}$/] },
  openai: { patterns: [/^sk-[A-Za-z0-9\-_.=/]{15,}$/] },
  mistral: { patterns: [/^sk-[A-Za-z0-9\-_.=/]{15,}$/] }
};

function isValidKey(provider, key) {
  if (!key || typeof key !== "string") return false;
  const trimmed = key.trim();
  if (trimmed === "") return false;

  // Prevent excessively large inputs that could impact performance or logging systems
  if (trimmed.length > 200) return false;

  // Key must only contain alphanumeric, dash, underscore, dot, slash, and equals characters
  if (!BASIC_KEY_REGEX.test(trimmed)) return false;

  const normalizedProvider = provider?.toLowerCase();
  const rule = PROVIDER_RULES[normalizedProvider];

  if (rule?.patterns) {
    return rule.patterns.some(regex => regex.test(trimmed));
  }

  // Stricter fallback for unknown/dynamic providers
  return trimmed.length > 30;
}

function getEnvKey(provider) {
  if (!provider) return null;
  const normalized = provider.toLowerCase();
  const envVar = `${normalized.toUpperCase()}_API_KEY`;
  const value = process.env[envVar];
  return typeof value === "string" ? value : null;
}

export function resolveApiKey(provider) {
  const envKey = getEnvKey(provider);
  if (!envKey) return null;

  const trimmed = envKey.trim();

  if (isValidKey(provider, trimmed)) {
    return trimmed;
  }

  // Traceable fallback logging under debug mode
  if (process.env.GITGENIE_DEBUG === "true") {
    console.log(`[DEBUG] Invalid ENV API key detected for ${provider}, falling back`);
  }
  return null;
}
