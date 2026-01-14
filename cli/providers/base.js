/**
 * Base abstract class for AI providers
 * All AI providers must extend this class and implement its methods
 */
export class AIProvider {
    constructor(apiKey) {
        if (new.target === AIProvider) {
            throw new Error('AIProvider is an abstract class and cannot be instantiated directly');
        }
        if (!apiKey || typeof apiKey !== 'string') {
            throw new Error('API key is required and must be a string');
        }
        this.apiKey = apiKey;
    }

    /**
     * Get the name of this provider
     * @returns {string} Provider name (e.g., 'gemini', 'mistral')
     */
    getName() {
        throw new Error('getName() must be implemented by provider');
    }

    /**
     * Validate API key format for this provider
     * @param {string} apiKey - API key to validate
     * @returns {boolean} True if valid format
     */
    validateApiKey(apiKey) {
        throw new Error('validateApiKey() must be implemented by provider');
    }

    /**
     * Generate a commit message based on git diff
     * @param {string} diff - Git diff output
     * @param {Object} opts - Options including type, scope, genie flag
     * @param {string} desc - User-provided description
     * @returns {Promise<string>} Generated commit message
     */
    async generateCommitMessage(diff, opts, desc) {
        throw new Error('generateCommitMessage() must be implemented by provider');
    }

    /**
     * Generate a PR title based on git diff
     * @param {string} diff - Git diff output
     * @param {Object} opts - Options including genie flag
     * @param {string} desc - User-provided description
     * @returns {Promise<string>} Generated PR title
     */
    async generatePRTitle(diff, opts, desc) {
        throw new Error('generatePRTitle() must be implemented by provider');
    }

    /**
     * Generate a branch name based on description
     * @param {string} desc - Description of the branch purpose
     * @param {Object} opts - Options including genie flag
     * @returns {Promise<string>} Generated branch name
     */
    async generateBranchName(desc, opts) {
        throw new Error('generateBranchName() must be implemented by provider');
    }

    /**
     * Group files using AI analysis for atomic commits
     * @param {Object} filesData - { files: Array, diffs: Object }
     * @param {number} maxGroups - Maximum number of groups to create
     * @returns {Promise<Array>} Array of group objects
     */
    async groupFilesWithAI(filesData, maxGroups = 5) {
        throw new Error('groupFilesWithAI() must be implemented by provider');
    }

    /**
     * Generate commit message for a specific file group
     * @param {Object} group - Group object with files, type, scope, description
     * @param {Object} filesData - Original files data with diffs
     * @returns {Promise<string>} Commit message for the group
     */
    async generateCommitMessageForGroup(group, filesData) {
        throw new Error('generateCommitMessageForGroup() must be implemented by provider');
    }

    /**
     * Get provider-specific model name/identifier
     * @returns {string} Model identifier
     */
    getModelName() {
        throw new Error('getModelName() must be implemented by provider');
    }

    /**
     * Get provider documentation URL
     * @returns {string} Documentation URL
     */
    getDocsUrl() {
        throw new Error('getDocsUrl() must be implemented by provider');
    }
}
