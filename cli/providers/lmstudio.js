import { AIProvider } from './base.js';
import ora from 'ora';

/**
 * LM Studio local AI provider.
 *
 * LM Studio exposes a fully OpenAI-compatible REST API at /v1/chat/completions.
 * No API key required — requires LM Studio to be running with a model loaded.
 *
 * Default server: http://localhost:1234
 * Configure with: gg config --provider lmstudio --url <url> --model <model>
 */
export class LMStudioProvider extends AIProvider {
    constructor(config = {}) {
        super(config);
        this.baseUrl = (config.baseUrl || 'http://localhost:1234').replace(/\/$/, '');
        this.model = config.model || 'llama-3.2-3b-instruct';
    }

    isLocalProvider() { return true; }
    getName() { return 'lmstudio'; }
    getModelName() { return this.model; }
    getDocsUrl() { return 'https://lmstudio.ai/docs'; }
    validateApiKey() { return true; }

    // Max diff characters to send — keeps prompt safely within small context windows
    static MAX_DIFF_CHARS = 3000;

    async ping() {
        try {
            const res = await fetch(`${this.baseUrl}/v1/models`, { signal: AbortSignal.timeout(3000) });
            return res.ok;
        } catch { return false; }
    }

    async #ensureRunning() {
        if (!(await this.ping())) {
            throw new Error(
                `LM Studio server not reachable at ${this.baseUrl}.\n` +
                `  • Open LM Studio, load a model, and enable the local server (port 1234)\n` +
                `  • Or change the URL with: gg config --provider lmstudio --url <url> --model <model>`
            );
        }
    }

    async #chat(prompt, maxTokens = 500) {
        const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: this.model,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.3,
                max_tokens: maxTokens,
                stream: false,
            }),
            signal: AbortSignal.timeout(60000),
        });

        if (!response.ok) {
            const errText = await response.text().catch(() => '');
            if (
                response.status === 404 ||
                errText.toLowerCase().includes('not found') ||
                errText.toLowerCase().includes('not loaded')
            ) {
                throw new Error(
                    `Model "${this.model}" is not loaded in LM Studio.\n` +
                    `  • Open LM Studio and load the model: ${this.model}\n` +
                    `  • Or reconfigure with: gg config --provider lmstudio --url <url> --model <model>`
                );
            }
            throw new Error(`LM Studio API error (HTTP ${response.status}): ${errText}`);
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content?.trim() ?? '';
    }

    async generateCommitMessage(diff, opts, desc) {
        await this.#ensureRunning();
        const safeDiff = diff.length > LMStudioProvider.MAX_DIFF_CHARS
            ? diff.substring(0, LMStudioProvider.MAX_DIFF_CHARS) + '\n... (diff truncated to fit context window)'
            : diff;
        const prompt = `You are a senior software engineer. Generate a professional git commit message.

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
${safeDiff}

Return ONLY the commit message, no explanations or quotes.`;
        return (await this.#chat(prompt, 100)) || `${opts.type}: ${desc}`;
    }

    async generatePRTitle(diff, opts, desc) {
        await this.#ensureRunning();
        const safeDiff = diff.length > LMStudioProvider.MAX_DIFF_CHARS
            ? diff.substring(0, LMStudioProvider.MAX_DIFF_CHARS) + '\n... (diff truncated to fit context window)'
            : diff;
        const prompt = `You are a senior software engineer creating a Pull Request title.

REQUIREMENTS:
- Clear, concise description of changes
- Under 60 characters
- Use imperative mood
- No period at end
- Professional tone

Code diff to analyze:
${safeDiff}

Context: ${desc}

Return ONLY the PR title, no explanations or quotes.`;
        return (await this.#chat(prompt, 50)) || desc;
    }

    async generateBranchName(desc, opts) {
        await this.#ensureRunning();
        const prompt = `Generate a git branch name following best practices.

REQUIREMENTS:
- Format: type/short-description
- Use kebab-case (lowercase with hyphens)
- Keep under 40 characters
- Types: feature, bugfix, hotfix, refactor, docs, test, chore
- No special characters except hyphens and slashes

Description: ${desc}

Return ONLY the branch name, no explanations or quotes.`;
        return (await this.#chat(prompt, 30)) || `feature/${desc.toLowerCase().replace(/\s+/g, '-')}`;
    }

    async groupFilesWithAI(filesData, maxGroups = 5) {
        const spinner = ora(`🧞 Analyzing changes with LM Studio (${this.model})...`).start();
        try {
            await this.#ensureRunning();
            const fileSummary = filesData.files.map(f => {
                const diff = filesData.diffs[f.path] || '';
                const truncatedDiff = diff.length > 500 ? diff.substring(0, 500) + '\n... (truncated)' : diff;
                return { path: f.path, status: f.status, diff: truncatedDiff };
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

            const responseText = await this.#chat(prompt, 2000);
            spinner.succeed(`✓ LM Studio (${this.model}) analysis complete`);

            let jsonText = responseText;
            const jsonMatch = responseText.match(/```(?:json)?\s*(\[[\s\S]*\])\s*```/);
            if (jsonMatch) jsonText = jsonMatch[1];

            const groups = JSON.parse(jsonText);
            if (!Array.isArray(groups)) throw new Error('AI response is not an array');

            groups.forEach((group, idx) => {
                if (!group.files || !Array.isArray(group.files)) throw new Error(`Group ${idx} missing files array`);
                if (!group.type) group.type = 'chore';
                if (!group.scope) group.scope = '';
                if (!group.description) group.description = 'changes';
                if (!group.rationale) group.rationale = '';
            });

            return groups;
        } catch (err) {
            spinner.fail(`LM Studio (${this.model}) analysis failed`);
            if (err instanceof SyntaxError) throw new Error('Failed to parse AI response as JSON');
            throw err;
        }
    }

    async generateCommitMessageForGroup(group, filesData) {
        const manualMessage = `${group.type}${group.scope ? `(${group.scope})` : ''}: ${group.description}`;
        try {
            await this.#ensureRunning();
            const groupDiffs = group.files.map(file => {
                const diff = filesData.diffs[file] || '';
                const truncated = diff.length > 300 ? diff.substring(0, 300) + '\n... (truncated)' : diff;
                return `File: ${file}\n${truncated}`;
            }).join('\n---\n');

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

            const message = (await this.#chat(prompt, 100)) || manualMessage;
            if (message.length > 72 || !message.includes(':')) return manualMessage;
            return message;
        } catch { return manualMessage; }
    }
}
