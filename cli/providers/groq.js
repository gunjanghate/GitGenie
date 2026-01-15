import Groq from 'groq-sdk';
import { AIProvider } from './base.js';
import ora from 'ora';

/**
 * Groq AI Provider implementation
 */
export class GroqProvider extends AIProvider {
    constructor(apiKey) {
        super(apiKey);
        this.client = new Groq({ apiKey });
        this.model = 'llama-3.3-70b-versatile';
    }

    getName() {
        return 'groq';
    }

    getModelName() {
        return this.model;
    }

    getDocsUrl() {
        return 'https://console.groq.com/docs';
    }

    validateApiKey(apiKey) {
        // Groq API keys start with 'gsk_'
        return typeof apiKey === 'string' && apiKey.startsWith('gsk_') && apiKey.length > 20;
    }

    /**
     * Generate commit message using Groq
     */
    async generateCommitMessage(diff, opts, desc) {
        const prompt = `You are a senior software engineer at a Fortune 500 company. Generate a professional git commit message following strict industry standards.

    REQUIREMENTS:
    - Follow Conventional Commits specification exactly
    - Format: type(scope): description
    - Description must be under 50 characters
    - Use imperative mood (add, fix, update, not adds, fixes, updates)
    - First letter of description lowercase
    - No period at the end
    - Choose appropriate type: feat, fix, docs, style, refactor, test, chore, ci, build, perf
    - Include scope when relevant (component/module/area affected)

    Code diff to analyze:
    ${diff}

    Return ONLY the commit message, no explanations or quotes.`;

        const response = await this.client.chat.completions.create({
            model: this.model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 100,
        });

        return response.choices?.[0]?.message?.content?.trim() || `${opts.type}: ${desc}`;
    }

    /**
     * Generate PR title using Groq
     */
    async generatePRTitle(diff, opts, desc) {
        const prompt = `You are a senior software engineer creating a Pull Request title.

    REQUIREMENTS:
    - Clear, concise description of changes
    - Under 60 characters
    - Use imperative mood
    - No period at end
    - Professional tone

    Code diff to analyze:
    ${diff}

    Context: ${desc}

    Return ONLY the PR title, no explanations or quotes.`;

        const response = await this.client.chat.completions.create({
            model: this.model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 50,
        });

        return response.choices?.[0]?.message?.content?.trim() || desc;
    }

    /**
     * Generate branch name using Groq
     */
    async generateBranchName(desc, opts) {
        const prompt = `Generate a git branch name following best practices.

    REQUIREMENTS:
    - Format: type/short-description
    - Use kebab-case (lowercase with hyphens)
    - Keep under 40 characters
    - Types: feature, bugfix, hotfix, refactor, docs, test, chore
    - No special characters except hyphens and slashes

    Description: ${desc}

    Return ONLY the branch name, no explanations or quotes.`;

        const response = await this.client.chat.completions.create({
            model: this.model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 30,
        });

        return response.choices?.[0]?.message?.content?.trim() || `feature/${desc.toLowerCase().replace(/\s+/g, '-')}`;
    }

    /**
     * Group files using Groq AI analysis
     */
    async groupFilesWithAI(filesData, maxGroups = 5) {
        const spinner = ora('🧞 Analyzing changes with Groq AI...').start();

        try {
            // Prepare file summary for AI (limit diff size to avoid token limits)
            const fileSummary = filesData.files.map(f => {
                const diff = filesData.diffs[f.path] || '';
                const truncatedDiff = diff.length > 500 ? diff.substring(0, 500) + '\n... (truncated)' : diff;
                return {
                    path: f.path,
                    status: f.status,
                    diff: truncatedDiff
                };
            });

            const prompt = `You are a senior software engineer analyzing git changes to create logical, atomic commits.

TASK: Analyze the following staged files and group them into separate commits based on semantic relationships.

RULES:
1. Each group should represent ONE logical change (feature, fix, refactor, etc.)
2. Related files should be grouped together (e.g., component + test + styles)
3. Unrelated changes should be in separate groups
4. Maximum ${maxGroups} groups
5. Each group must have a clear purpose
6. Follow Conventional Commits specification for types

FILES AND CHANGES:
${JSON.stringify(fileSummary, null, 2)}

Return a JSON array of groups with this structure:
[
  {
    "files": ["path/to/file1.js", "path/to/file2.test.js"],
    "type": "feat|fix|docs|style|refactor|test|chore|ci|build|perf",
    "scope": "component/module name (optional)",
    "description": "brief description of this group's changes",
    "rationale": "why these files belong together"
  }
]

IMPORTANT: 
- Every file must be assigned to exactly one group
- Groups should be ordered by importance (most significant first)
- Return ONLY valid JSON, no explanations or markdown code blocks
- If scope is not applicable, use empty string ""`;

            const response = await this.client.chat.completions.create({
                model: this.model,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.4,
                max_tokens: 2000,
            });

            spinner.succeed('✓ Groq AI analysis complete');

            const responseText = response.choices?.[0]?.message?.content?.trim() || '';

            // Try to extract JSON from response (handle markdown code blocks)
            let jsonText = responseText;
            const jsonMatch = responseText.match(/```(?:json)?\s*(\[[\s\S]*\])\s*```/);
            if (jsonMatch) {
                jsonText = jsonMatch[1];
            }

            const groups = JSON.parse(jsonText);

            // Validate groups structure
            if (!Array.isArray(groups)) {
                throw new Error('AI response is not an array');
            }

            // Ensure all required fields exist
            groups.forEach((group, idx) => {
                if (!group.files || !Array.isArray(group.files)) {
                    throw new Error(`Group ${idx} missing files array`);
                }
                if (!group.type) group.type = 'chore';
                if (!group.scope) group.scope = '';
                if (!group.description) group.description = 'changes';
                if (!group.rationale) group.rationale = '';
            });

            return groups;
        } catch (err) {
            spinner.fail('Groq AI analysis failed');

            if (err instanceof SyntaxError) {
                throw new Error('Failed to parse AI response as JSON');
            }

            throw err;
        }
    }

    /**
     * Generate commit message for a specific group using Groq
     */
    async generateCommitMessageForGroup(group, filesData) {
        // Manual fallback format
        const manualMessage = `${group.type}${group.scope ? `(${group.scope})` : ''}: ${group.description}`;

        try {
            // Get diffs for files in this group
            const groupDiffs = group.files
                .map(file => {
                    const diff = filesData.diffs[file] || '';
                    const truncated = diff.length > 300 ? diff.substring(0, 300) + '\n... (truncated)' : diff;
                    return `File: ${file}\n${truncated}`;
                })
                .join('\n---\n');

            const prompt = `You are a senior software engineer creating a git commit message.

Generate a professional commit message following Conventional Commits specification.

REQUIREMENTS:
- Format: type(scope): description
- Description under 50 characters
- Imperative mood (add, fix, update)
- Lowercase description
- No period at end
- Type: ${group.type}
${group.scope ? `- Scope: ${group.scope}` : ''}

FILES IN THIS COMMIT:
${group.files.join('\n')}

CHANGES:
${groupDiffs}

CONTEXT: ${group.description}

Return ONLY the commit message, no quotes or explanations.`;

            const response = await this.client.chat.completions.create({
                model: this.model,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.3,
                max_tokens: 100,
            });

            const message = response.choices?.[0]?.message?.content?.trim() || manualMessage;

            // Validate format
            if (message.length > 72 || !message.includes(':')) {
                return manualMessage;
            }

            return message;
        } catch (err) {
            // Silently fall back to manual message
            return manualMessage;
        }
    }
}
