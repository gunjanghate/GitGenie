import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import chalk from 'chalk';

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
        throw new Error(`Provider "${providerName}" is not configured. Please configure it first with: gg config <apikey> --provider ${providerName}`);
    }

    config.activeProvider = providerName;
    fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
}

/**
 * Get active provider instance
 * @returns {Promise<AIProvider|null>} Provider instance or null
 */
export async function getActiveProviderInstance() {
    const { ProviderFactory } = await import('../providers/index.js');

    const activeProviderName = await getActiveProvider();
    if (!activeProviderName) return null;

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
        .option('--provider <name>', 'Provider name (gemini, mistral, groq)', 'gemini')
        .option('--status', 'Check configuration status of all providers')
        .action(async (apikey, options) => {
            try {
                const { ProviderFactory } = await import('../providers/index.js');

                // Mode 1: Check Status
                if (options.status) {
                    console.log(chalk.bold('\n🔮 AI Provider Configuration Status:\n'));

                    const providers = ProviderFactory.getSupportedProviders();
                    let hasConfigured = false;

                    for (const provider of providers) {
                        const key = await getProviderApiKey(provider);
                        const isConfigured = !!key;
                        const statusColor = isConfigured ? chalk.green : chalk.gray;
                        const statusIcon = isConfigured ? '✅' : '❌';
                        const statusText = isConfigured ? 'Configured' : 'Not configured';
                        const padding = ' '.repeat(10 - provider.length);

                        console.log(`  ${chalk.cyan(provider.charAt(0).toUpperCase() + provider.slice(1))}${padding}: ${statusIcon} ${statusColor(statusText)}`);
                        if (isConfigured) hasConfigured = true;
                    }

                    console.log(''); // Empty line
                    if (!hasConfigured) {
                        console.log(chalk.yellow('  No providers configured yet.'));
                        console.log(chalk.cyan('  Run: gg config <your-key> --provider <name>'));
                    }
                    process.exit(0);
                }

                // Mode 2: Save API Key
                if (!apikey) {
                    console.error(chalk.red('Error: API key is required when not using --status'));
                    console.log(chalk.cyan('Usage: gg config <apikey>'));
                    console.log(chalk.cyan('Check Status: gg config --status'));
                    process.exit(1);
                }

                const providerName = options.provider.toLowerCase();

                // Validate provider is supported
                if (!ProviderFactory.isProviderSupported(providerName)) {
                    console.error(chalk.red(`Unknown AI provider: "${providerName}"`));
                    console.log(chalk.yellow(`Supported providers: ${ProviderFactory.getSupportedProviders().join(', ')}`));
                    console.log(chalk.cyan('Set your provider with: gg key --gemini <your-key>'));
                    process.exit(1);
                }

                await saveProviderApiKey(providerName, apikey);
                console.log(chalk.green(`${providerName.charAt(0).toUpperCase() + providerName.slice(1)} API key saved successfully!`));
                console.log(chalk.cyan(`${providerName} is now your active AI provider`));
            } catch (err) {
                console.error(chalk.red('Failed to save API key.'));
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
        .action(async (options) => {
            try {
                let providerName = null;

                if (options.gemini) providerName = 'gemini';
                else if (options.mistral) providerName = 'mistral';
                else if (options.groq) providerName = 'groq';

                if (!providerName) {
                    console.error(chalk.red('Please specify a provider:'));
                    console.log(chalk.cyan('  gg use --gemini'));
                    console.log(chalk.cyan('  gg use --mistral'));
                    console.log(chalk.cyan('  gg use --groq'));
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
