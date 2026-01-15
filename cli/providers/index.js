import { GeminiProvider } from './gemini.js';
import { MistralProvider } from './mistral.js';
import { GroqProvider } from './groq.js';

/**
 * Provider registry and factory
 */
export class ProviderFactory {
    static providers = {
        gemini: GeminiProvider,
        mistral: MistralProvider,
        groq: GroqProvider,
    };

    /**
     * Get an instance of the specified provider
     * @param {string} providerName - Name of the provider (gemini, mistral)
     * @param {string} apiKey - API key for the provider
     * @returns {AIProvider} Provider instance
     */
    static getProvider(providerName, apiKey) {
        const normalizedName = providerName.toLowerCase();
        const ProviderClass = this.providers[normalizedName];

        if (!ProviderClass) {
            throw new Error(`Unknown provider: ${providerName}. Supported providers: ${this.getSupportedProviders().join(', ')}`);
        }

        return new ProviderClass(apiKey);
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
}
