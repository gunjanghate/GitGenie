import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import chalk from 'chalk';
import inquirer from 'inquirer';

// Local providers don't use API keys — they connect to a running local server
const LOCAL_PROVIDERS = ['ollama', 'lmstudio'];

// Try to import keytar, but make it optional for environments without native dependencies
let keytar = null;
try {
    const keytarModule = await import('keytar');
    keytar = keytarModule.default;
} catch (error) {
    // Keytar not available (missing libsecret or other native deps)
    // Will fall back to file-based config storage
}

// Keytar service configuration
const SERVICE_NAME = "GitGenie";
const ACCOUNT_NAME = "gemini_api_key";
const ENCRYPTION_KEY_ACCOUNT = "encryption_key";

// Config file path (~/.gitgenie/config.json)
const configDir = path.join(os.homedir(), '.gitgenie');
const configFile = path.join(configDir, 'config.json');

// Generate or retrieve unique encryption key for this user
export async function getEncryptionKey() {
    try {
        // Try to get existing encryption key from keytar (if available)
        if (keytar) {
            let encryptionKey = await keytar.getPassword(SERVICE_NAME, ENCRYPTION_KEY_ACCOUNT);

            if (!encryptionKey) {
                // Generate a new random 32-byte key for this user
                encryptionKey = crypto.randomBytes(32).toString('hex');
                // Store it securely in keytar
                await keytar.setPassword(SERVICE_NAME, ENCRYPTION_KEY_ACCOUNT, encryptionKey);
            }

            return encryptionKey;
        }
    } catch (error) {
        // Keytar operation failed, fall through to fallback
    }

    // Fallback: generate a unique key based on user's home directory and machine
    const uniqueData = os.homedir() + os.hostname() + os.userInfo().username;
    return crypto.createHash('sha256').update(uniqueData).digest('hex');
}

export async function encrypt(text) {
    if (!text || typeof text !== 'string') {
        throw new Error('Text to encrypt must be a non-empty string');
    }

    try {
        const encryptionKey = await getEncryptionKey();
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(encryptionKey, 'hex'), iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
        throw new Error(`Encryption failed: ${error.message}`);
    }
}

export async function decrypt(text) {
    if (!text || typeof text !== 'string') {
        throw new Error('Text to decrypt must be a non-empty string');
    }

    try {
        const encryptionKey = await getEncryptionKey();

        // Validate format - must contain exactly one colon
        const parts = text.split(':');
        if (parts.length !== 2) {
            throw new Error('Invalid encrypted data format');
        }

        const [ivHex, encrypted] = parts;

        // Validate hex strings
        if (!ivHex || !encrypted || ivHex.length !== 32) {
            throw new Error('Invalid encrypted data structure');
        }

        const iv = Buffer.from(ivHex, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(encryptionKey, 'hex'), iv);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (error) {
        throw new Error(`Decryption failed: ${error.message}`);
    }
}

/**
 * Migrate old config format to new multi-provider format
 * @param {Object} oldConfig - Old config with GEMINI_API_KEY
 * @returns {Object} New config format
 */
export async function migrateConfig(oldConfig) {
    if (oldConfig.providers) {
        // Already in new format
        return oldConfig;
    }

    // Backup old config
    const backupFile = path.join(configDir, 'config.json.backup');
    if (!fs.existsSync(backupFile)) {
        fs.writeFileSync(backupFile, JSON.stringify(oldConfig, null, 2));
    }

    // Migrate to new format
    const newConfig = {
        providers: {},
        activeProvider: 'gemini'
    };

    if (oldConfig.GEMINI_API_KEY) {
        newConfig.providers.gemini = {
            apiKey: oldConfig.GEMINI_API_KEY,
            configuredAt: new Date().toISOString()
        };
    }

    return newConfig;
}

/**
 * Get provider configuration
 * @returns {Promise<Object>} Config object with providers and activeProvider
 */
export async function getProviderConfig() {
    // Check if config file exists
    if (fs.existsSync(configFile)) {
        try {
            const config = JSON.parse(fs.readFileSync(configFile, 'utf-8'));

            // Migrate old format if needed
            const migratedConfig = await migrateConfig(config);

            // Save migrated config if it was changed
            if (!config.providers && migratedConfig.providers) {
                fs.writeFileSync(configFile, JSON.stringify(migratedConfig, null, 2));
            }

            return migratedConfig;
        } catch (jsonError) {
            // If JSON parsing fails, return empty config
            return { providers: {}, activeProvider: null };
        }
    }

    return { providers: {}, activeProvider: null };
}

/**
 * Get API key for a specific provider
 * @param {string} providerName - Provider name (gemini, mistral)
 * @returns {Promise<string|null>} Decrypted API key or null
 */
export async function getProviderApiKey(providerName) {
    // First check environment variable for Gemini (backward compatibility)
    if (providerName === 'gemini' && process.env.GEMINI_API_KEY) {
        return process.env.GEMINI_API_KEY;
    }

    // Check keytar (secure storage) if available
    if (keytar) {
        try {
            const keytarAccount = `${providerName}_api_key`;
            const keyFromKeytar = await keytar.getPassword(SERVICE_NAME, keytarAccount);
            if (keyFromKeytar) return keyFromKeytar;
        } catch (error) {
            // Keytar failed, continue to config.json fallback
        }
    }

    // Fallback to config.json (encrypted)
    const config = await getProviderConfig();
    const providerConfig = config.providers[providerName];

    if (providerConfig && providerConfig.apiKey) {
        try {
            // Decrypt before returning
            return await decrypt(providerConfig.apiKey);
        } catch (decryptError) {
            // If decryption fails, the config file might be corrupted
            console.warn(chalk.yellow(`${providerName} API key appears corrupted. Please reconfigure.`));
            return null;
        }
    }

    return null;
}

/**
 * Save API key for a specific provider
 * @param {string} providerName - Provider name (gemini, mistral)
 * @param {string} apikey - API key to save
 */
export async function saveProviderApiKey(providerName, apikey) {
    // Validate input
    if (!apikey || typeof apikey !== 'string' || apikey.trim().length === 0) {
        throw new Error('API key must be a non-empty string');
    }

    const trimmedApiKey = apikey.trim();
    const keytarAccount = `${providerName}_api_key`;

    if (keytar) {
        try {
            // Try to save to keytar first (secure storage)
            await keytar.setPassword(SERVICE_NAME, keytarAccount, trimmedApiKey);
        } catch (error) {
            // Keytar failed, fallback to config.json (encrypted)
        }
    }

    // Also save to config.json for persistence
    try {
        if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true });

        const config = await getProviderConfig();

        // Initialize providers object if it doesn't exist
        if (!config.providers) config.providers = {};

        // Encrypt and save API key
        const encryptedKey = await encrypt(trimmedApiKey);
        config.providers[providerName] = {
            apiKey: encryptedKey,
            configuredAt: new Date().toISOString()
        };

        // Set as active provider (last configured wins)
        config.activeProvider = providerName;

        fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
        return true;
    } catch (err) {
        throw new Error(`Failed to save API key: ${err.message}`);
    }
}

/**
 * Get the active provider name
 * @returns {Promise<string|null>} Active provider name or null
 */
export async function getActiveProvider() {
    const config = await getProviderConfig();
    return config.activeProvider || null;
}

/**
 * Set the active provider
 * @param {string} providerName - Provider name to set as active
 */
export async function setActiveProvider(providerName) {
    const config = await getProviderConfig();

    // Check if provider is configured
    if (!config.providers[providerName]) {
        const isLocal = LOCAL_PROVIDERS.includes(providerName.toLowerCase());
        const hint = isLocal
            ? `gg config --provider ${providerName} --url <server-url> --model <model-name>`
            : `gg config <apikey> --provider ${providerName}`;
        throw new Error(`Provider "${providerName}" is not configured. Please configure it first with: ${hint}`);
    }

    config.activeProvider = providerName;
    fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
}

/**
 * Fetch available models from a local AI server.
 * Returns an array of model name strings, or empty array if server is unreachable.
 * @param {string} providerName - 'ollama' | 'lmstudio'
 * @param {string} baseUrl
 * @returns {Promise<string[]>}
 */
async function fetchAvailableModels(providerName, baseUrl) {
    try {
        if (providerName === 'ollama') {
            const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/tags`, {
                signal: AbortSignal.timeout(3000),
            });
            if (!res.ok) return [];
            const data = await res.json();
            return (data.models || []).map(m => m.name).filter(Boolean);
        } else {
            // LM Studio — OpenAI-compatible /v1/models
            const res = await fetch(`${baseUrl.replace(/\/$/, '')}/v1/models`, {
                signal: AbortSignal.timeout(3000),
            });
            if (!res.ok) return [];
            const data = await res.json();
            return (data.data || []).map(m => m.id).filter(Boolean);
        }
    } catch {
        return [];
    }
}

/**
 * Determine the model to use for a local provider.
 * If --model was explicitly given, use it.
 * Otherwise try to fetch models from the live server:
 *   - 1 model  → use it automatically
 *   - multiple → prompt the user to pick one
 *   - 0 / unreachable → warn and fall back to the default
 * @param {string} providerName
 * @param {string} baseUrl
 * @param {string|undefined} explicitModel - value of --model flag
 * @param {string} fallbackModel
 * @returns {Promise<string>}
 */
async function resolveModel(providerName, baseUrl, explicitModel, fallbackModel) {
    if (explicitModel) return explicitModel;

    console.log(chalk.gray(`  Fetching available models from ${baseUrl}...`));
    const models = await fetchAvailableModels(providerName, baseUrl);

    if (models.length === 0) {
        console.log(chalk.yellow(`  ⚠  Could not reach server at ${baseUrl} — using default model "${fallbackModel}".`));
        console.log(chalk.gray(`     Start the server then run: gg config --provider ${providerName} --url ${baseUrl} --model <model>`));
        return fallbackModel;
    }

    if (models.length === 1) {
        console.log(chalk.green(`  ✓ Found model: ${models[0]}`));
        return models[0];
    }

    // Multiple models — let the user pick
    const { chosen } = await inquirer.prompt([
        {
            type: 'list',
            name: 'chosen',
            message: `Select a model for ${providerName}:`,
            choices: models,
        },
    ]);
    return chosen;
}

/**
 * Save configuration for a local provider (Ollama, LM Studio).
 * Stores baseUrl and model in config.json — no API key involved.
 * @param {string} providerName - e.g. 'ollama', 'lmstudio'
 * @param {string} baseUrl - e.g. 'http://localhost:11434'
 * @param {string} model - e.g. 'llama3.2'
 */
export async function saveLocalProviderConfig(providerName, baseUrl, model) {
    if (!baseUrl || typeof baseUrl !== 'string' || baseUrl.trim().length === 0) {
        throw new Error('Base URL must be a non-empty string');
    }
    if (!model || typeof model !== 'string' || model.trim().length === 0) {
        throw new Error('Model name must be a non-empty string');
    }

    try {
        if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true });

        const config = await getProviderConfig();
        if (!config.providers) config.providers = {};

        config.providers[providerName] = {
            baseUrl: baseUrl.trim(),
            model: model.trim(),
            configuredAt: new Date().toISOString(),
        };
        config.activeProvider = providerName;

        fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
        return true;
    } catch (err) {
        throw new Error(`Failed to save local provider config: ${err.message}`);
    }
}

/**
 * Get configuration for a local provider.
 * @param {string} providerName - e.g. 'ollama', 'lmstudio'
 * @returns {Promise<{baseUrl: string, model: string}|null>}
 */
export async function getLocalProviderConfig(providerName) {
    const config = await getProviderConfig();
    const providerConfig = config.providers?.[providerName];
    if (!providerConfig || !providerConfig.baseUrl) return null;
    return { baseUrl: providerConfig.baseUrl, model: providerConfig.model };
}

/**
 * Get active provider instance
 * @returns {Promise<AIProvider|null>} Provider instance or null
 */
export async function getActiveProviderInstance() {
    const { ProviderFactory } = await import('../providers/index.js');

    const activeProviderName = await getActiveProvider();
    if (!activeProviderName) return null;

    // Local providers (Ollama, LM Studio): initialize with baseUrl + model, no API key
    if (ProviderFactory.isLocalProvider(activeProviderName)) {
        const localConfig = await getLocalProviderConfig(activeProviderName);
        if (!localConfig) {
            console.error(chalk.red(`Local provider "${activeProviderName}" is not configured.`));
            console.log(chalk.cyan(`Run: gg config --provider ${activeProviderName} --url <url> --model <model>`));
            return null;
        }
        try {
            return ProviderFactory.getProvider(activeProviderName, localConfig);
        } catch (err) {
            console.error(chalk.red(`Failed to initialize ${activeProviderName} provider.`));
            console.error(chalk.yellow(err.message));
            return null;
        }
    }

    // Cloud providers: get encrypted API key (backward compatible)
    const apiKey = await getProviderApiKey(activeProviderName);
    if (!apiKey) return null;

    try {
        return ProviderFactory.getProvider(activeProviderName, apiKey);
    } catch (err) {
        console.error(chalk.red(`Failed to initialize ${activeProviderName} AI provider.`));
        console.error(chalk.yellow(err.message));
        console.log(chalk.cyan(`Check your API key with: gg key --${activeProviderName}`));
        return null;
    }
}

// Legacy function for backward compatibility
export async function getApiKey() {
    return await getProviderApiKey('gemini');
}

export async function saveApiKey(apikey) {
    return await saveProviderApiKey('gemini', apikey);
}

/**
 * Register config-related commands
 * @param {import('commander').Command} program 
 */
export function registerConfigCommand(program) {
    // Register `config`
    program
        .command('config [apikey]')
        .description('Save your AI provider API key or check configuration status')
        .option('--provider <name>', 'Provider name (gemini, mistral, groq, ollama, lmstudio)', 'gemini')
        .option('--status', 'Check configuration status of all providers')
        // Local provider options (ollama / lmstudio)
        .option('--url <url>', 'Base URL for local AI server (e.g. http://localhost:11434)')
        .option('--model <model>', 'Model name for local AI provider (e.g. llama3.2)')
        .action(async (apikey, options) => {
            try {
                const { ProviderFactory } = await import('../providers/index.js');

                // Mode 1: Check Status
                if (options.status) {
                    console.log(chalk.bold('\n🔮 AI Provider Configuration Status:\n'));

                    const providers = ProviderFactory.getSupportedProviders();
                    let hasConfigured = false;

                    for (const provider of providers) {
                        const padding = ' '.repeat(10 - provider.length);
                        const label = chalk.cyan(provider.charAt(0).toUpperCase() + provider.slice(1));

                        if (ProviderFactory.isLocalProvider(provider)) {
                            // Local providers: show URL + model instead of API key status
                            const localConfig = await getLocalProviderConfig(provider);
                            const isConfigured = !!localConfig;
                            const statusIcon = isConfigured ? '✅' : '❌';
                            const statusText = isConfigured
                                ? chalk.green(`${localConfig.baseUrl}  model: ${localConfig.model}`)
                                : chalk.gray('Not configured');
                            console.log(`  ${label}${padding}: ${statusIcon} ${statusText}`);
                            if (isConfigured) hasConfigured = true;
                        } else {
                            // Cloud providers: show Configured / Not configured
                            const key = await getProviderApiKey(provider);
                            const isConfigured = !!key;
                            const statusIcon = isConfigured ? '✅' : '❌';
                            const statusText = isConfigured ? chalk.green('Configured') : chalk.gray('Not configured');
                            console.log(`  ${label}${padding}: ${statusIcon} ${statusText}`);
                            if (isConfigured) hasConfigured = true;
                        }
                    }

                    console.log(''); // Empty line
                    if (!hasConfigured) {
                        console.log(chalk.yellow('  No providers configured yet.'));
                        console.log(chalk.cyan('  Cloud:  gg config <your-key> --provider <name>'));
                        console.log(chalk.cyan('  Local:  gg config --provider ollama --url http://localhost:11434 --model llama3.2'));
                    }
                    process.exit(0);
                }

                const providerName = options.provider.toLowerCase();

                // Validate provider is supported
                if (!ProviderFactory.isProviderSupported(providerName)) {
                    console.error(chalk.red(`Unknown AI provider: "${providerName}"`));
                    console.log(chalk.yellow(`Supported providers: ${ProviderFactory.getSupportedProviders().join(', ')}`));
                    process.exit(1);
                }

                // Mode 2a: Save local provider config (Ollama / LM Studio)
                if (ProviderFactory.isLocalProvider(providerName)) {
                    const defaults = providerName === 'ollama'
                        ? { url: 'http://localhost:11434', model: 'llama3.2' }
                        : { url: 'http://localhost:1234', model: 'llama-3.2-3b-instruct' };

                    // Accept URL from either --url flag or the positional argument
                    // (users naturally type: gg config http://localhost:11434 --provider ollama)
                    const urlFromPositional =
                        apikey && (apikey.startsWith('http://') || apikey.startsWith('https://'))
                            ? apikey
                            : null;
                    const baseUrl = options.url || urlFromPositional || defaults.url;

                    // Resolve model: --model flag → live server query → fallback default
                    const model = await resolveModel(providerName, baseUrl, options.model, defaults.model);

                    await saveLocalProviderConfig(providerName, baseUrl, model);
                    console.log(chalk.green(`\n${providerName.charAt(0).toUpperCase() + providerName.slice(1)} configured successfully!`));
                    console.log(chalk.cyan(`  Server : ${baseUrl}`));
                    console.log(chalk.cyan(`  Model  : ${model}`));
                    console.log(chalk.cyan(`  Switch : gg use --${providerName}`));
                    process.exit(0);
                }

                // Mode 2b: Save cloud provider API key
                if (!apikey) {
                    console.error(chalk.red('Error: API key is required for cloud providers when not using --status'));
                    console.log(chalk.cyan('Usage: gg config <apikey> --provider <name>'));
                    console.log(chalk.cyan('Check Status: gg config --status'));
                    process.exit(1);
                }

                await saveProviderApiKey(providerName, apikey);
                console.log(chalk.green(`${providerName.charAt(0).toUpperCase() + providerName.slice(1)} API key saved successfully!`));
                console.log(chalk.cyan(`${providerName} is now your active AI provider`));
            } catch (err) {
                console.error(chalk.red('Failed to save configuration.'));
                console.error(chalk.yellow(err.message));
            }
            process.exit(0);
        });

    // Register `use` command for switching providers
    program
        .command('use')
        .description('Switch between AI providers')
        .option('--gemini', 'Switch to Gemini AI')
        .option('--mistral', 'Switch to Mistral AI')
        .option('--groq', 'Switch to Groq AI')
        .option('--ollama', 'Switch to Ollama (local)')
        .option('--lmstudio', 'Switch to LM Studio (local)')
        .action(async (options) => {
            try {
                let providerName = null;

                if (options.gemini) providerName = 'gemini';
                else if (options.mistral) providerName = 'mistral';
                else if (options.groq) providerName = 'groq';
                else if (options.ollama) providerName = 'ollama';
                else if (options.lmstudio) providerName = 'lmstudio';

                if (!providerName) {
                    console.error(chalk.red('Please specify a provider:'));
                    console.log(chalk.cyan('  gg use --gemini'));
                    console.log(chalk.cyan('  gg use --mistral'));
                    console.log(chalk.cyan('  gg use --groq'));
                    console.log(chalk.cyan('  gg use --ollama'));
                    console.log(chalk.cyan('  gg use --lmstudio'));
                    process.exit(1);
                }

                await setActiveProvider(providerName);
                console.log(chalk.green(`Switched to ${providerName.charAt(0).toUpperCase() + providerName.slice(1)} AI`));
                console.log(chalk.cyan(`All AI-powered features will now use ${providerName}`));
            } catch (err) {
                console.error(chalk.red('Failed to switch provider.'));
                console.error(chalk.yellow(err.message));
                process.exit(1);
            }
            process.exit(0);
        });
}
