import { GeminiProvider } from './gemini.js';
import { MistralProvider } from './mistral.js';
import { GroqProvider } from './groq.js';
import { OllamaProvider } from './ollama.js';
import { LMStudioProvider } from './lmstudio.js';

/**
 * Provider registry and factory
 */
export class ProviderFactory {
    static providers = {
        gemini: GeminiProvider,
        mistral: MistralProvider,
        groq: GroqProvider,
        ollama: OllamaProvider,
        lmstudio: LMStudioProvider,
    };

    /**
     * Providers that run locally and require a baseUrl + model instead of an API key.
     */
    static localProviders = ['ollama', 'lmstudio'];

    /**
     * Get an instance of the specified provider
     * @param {string} providerName - Name of the provider (gemini, mistral, groq, ollama, lmstudio)
     * @param {string|Object} apiKeyOrConfig - API key string for cloud providers, or {baseUrl, model} for local providers
     * @returns {AIProvider} Provider instance
     */
    static getProvider(providerName, apiKeyOrConfig) {
        const normalizedName = providerName.toLowerCase();
        const ProviderClass = this.providers[normalizedName];

        if (!ProviderClass) {
            throw new Error(`Unknown provider: ${providerName}. Supported providers: ${this.getSupportedProviders().join(', ')}`);
        }

        return new ProviderClass(apiKeyOrConfig);
    }

    /**
     * Get list of supported provider names
     * @returns {Array<string>} Array of provider names
     */
    static getSupportedProviders() {
        return Object.keys(this.providers);
    }

    /**
     * Get the default provider name
     * @returns {string} Default provider name
     */
    static getDefaultProvider() {
        return 'gemini';
    }

    /**
     * Check if a provider is supported
     * @param {string} providerName - Provider name to check
     * @returns {boolean} True if supported
     */
    static isProviderSupported(providerName) {
        return this.providers.hasOwnProperty(providerName.toLowerCase());
    }

    /**
     * Check if a provider is a local provider (no API key required).
     * @param {string} providerName - Provider name to check
     * @returns {boolean} True if local provider
     */
    static isLocalProvider(providerName) {
        return this.localProviders.includes(providerName.toLowerCase());
    }
}
