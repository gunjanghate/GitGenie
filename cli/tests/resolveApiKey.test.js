/**
 * Unit Tests for resolveApiKey
 * 
 * Verifies key resolution precedence, validation, and fallback logic.
 * To run: node tests/resolveApiKey.test.js
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import assert from 'assert';

// Override os.homedir before importing modules so they use a sandbox directory
const tempHome = path.resolve('./tests/temp_home');
os.homedir = () => tempHome;

// Import dynamically after overriding homedir
const { resolveApiKey } = await import('../utils/resolveApiKey.js');
const { getProviderApiKey, encrypt } = await import('../commands/config.js');

const configDir = path.join(tempHome, '.gitgenie');
const configFile = path.join(configDir, 'config.json');

async function setupConfig(provider, apiKey) {
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
    }
    if (apiKey === null) {
        if (fs.existsSync(configFile)) {
            fs.unlinkSync(configFile);
        }
    } else {
        const encryptedKey = await encrypt(apiKey);
        fs.writeFileSync(configFile, JSON.stringify({
            providers: {
                [provider]: {
                    apiKey: encryptedKey,
                    configuredAt: new Date().toISOString()
                }
            }
        }), 'utf-8');
    }
}

function cleanUp() {
    try {
        if (fs.existsSync(configFile)) {
            fs.unlinkSync(configFile);
        }
        if (fs.existsSync(configDir)) {
            fs.rmdirSync(configDir);
        }
        if (fs.existsSync(tempHome)) {
            fs.rmdirSync(tempHome);
        }
    } catch (e) {
        // Ignore cleanup errors
    }
}

async function runTests() {
    console.log('Running resolveApiKey unit tests...\n');
    let passed = 0;
    let failed = 0;

    const originalEnvGemini = process.env.GEMINI_API_KEY;
    const originalEnvOpenai = process.env.OPENAI_API_KEY;
    const originalEnvMistral = process.env.MISTRAL_API_KEY;
    const originalEnvGroq = process.env.GROQ_API_KEY;

    const clearEnv = () => {
        delete process.env.GEMINI_API_KEY;
        delete process.env.OPENAI_API_KEY;
        delete process.env.MISTRAL_API_KEY;
        delete process.env.GROQ_API_KEY;
    };

    const restoreEnv = () => {
        if (originalEnvGemini !== undefined) process.env.GEMINI_API_KEY = originalEnvGemini;
        else delete process.env.GEMINI_API_KEY;

        if (originalEnvOpenai !== undefined) process.env.OPENAI_API_KEY = originalEnvOpenai;
        else delete process.env.OPENAI_API_KEY;

        if (originalEnvMistral !== undefined) process.env.MISTRAL_API_KEY = originalEnvMistral;
        else delete process.env.MISTRAL_API_KEY;

        if (originalEnvGroq !== undefined) process.env.GROQ_API_KEY = originalEnvGroq;
        else delete process.env.GROQ_API_KEY;
    };

    // Case 1: Valid ENV Key
    try {
        clearEnv();
        process.env.GEMINI_API_KEY = 'AIzaSy-valid_gemini_api_key_more_than_20_chars';
        await setupConfig('gemini', 'config_key_that_should_be_ignored');

        const key = await getProviderApiKey('gemini');
        assert.strictEqual(key, 'AIzaSy-valid_gemini_api_key_more_than_20_chars', 'Should use valid env key');
        console.log('✅ Test 1 PASSED: Valid ENV Key');
        passed++;
    } catch (e) {
        console.log('❌ Test 1 FAILED:', e.message);
        failed++;
    }

    // Case 2: Invalid ENV + Valid Config
    try {
        clearEnv();
        process.env.GEMINI_API_KEY = 'invalid';
        await setupConfig('gemini', 'sk-valid_config_api_key_more_than_20_chars');

        const key = await getProviderApiKey('gemini');
        assert.strictEqual(key, 'sk-valid_config_api_key_more_than_20_chars', 'Should fall back to valid config key');
        console.log('✅ Test 2 PASSED: Invalid ENV + Valid Config');
        passed++;
    } catch (e) {
        console.log('❌ Test 2 FAILED:', e.message);
        failed++;
    }

    // Case 3: No ENV + Valid Config
    try {
        clearEnv();
        await setupConfig('gemini', 'sk-valid_config_api_key_more_than_20_chars');

        const key = await getProviderApiKey('gemini');
        assert.strictEqual(key, 'sk-valid_config_api_key_more_than_20_chars', 'Should use valid config key when no env');
        console.log('✅ Test 3 PASSED: No ENV + Valid Config');
        passed++;
    } catch (e) {
        console.log('❌ Test 3 FAILED:', e.message);
        failed++;
    }

    // Case 4: No ENV + No Config
    try {
        clearEnv();
        await setupConfig('gemini', null);

        const key = await getProviderApiKey('gemini');
        assert.strictEqual(key, null, 'Should return null when neither is available');
        console.log('✅ Test 4 PASSED: No ENV + No Config');
        passed++;
    } catch (e) {
        console.log('❌ Test 4 FAILED:', e.message);
        failed++;
    }

    // Case 5: Empty ENV
    try {
        clearEnv();
        process.env.GEMINI_API_KEY = '';
        await setupConfig('gemini', 'sk-valid_config_api_key_more_than_20_chars');

        const key = await getProviderApiKey('gemini');
        assert.strictEqual(key, 'sk-valid_config_api_key_more_than_20_chars', 'Should ignore empty env key and fall back to config');
        console.log('✅ Test 5 PASSED: Empty ENV');
        passed++;
    } catch (e) {
        console.log('❌ Test 5 FAILED:', e.message);
        failed++;
    }

    // Case 6: Multiple Providers (Mistral)
    try {
        clearEnv();
        process.env.MISTRAL_API_KEY = 'sk-valid_mistral_api_key_more_than_20_chars';
        await setupConfig('mistral', 'config_key_that_should_be_ignored');

        const key = await getProviderApiKey('mistral');
        assert.strictEqual(key, 'sk-valid_mistral_api_key_more_than_20_chars', 'Should support Mistral dynamic environment variable resolution');
        console.log('✅ Test 6 PASSED: Mistral API Key Resolution');
        passed++;
    } catch (e) {
        console.log('❌ Test 6 FAILED:', e.message);
        failed++;
    }

    // Case 7: Malformed long key (invalid characters/spaces)
    try {
        clearEnv();
        process.env.GEMINI_API_KEY = 'this is definitely not a valid key but long enough';
        await setupConfig('gemini', 'sk-valid_config_api_key_more_than_20_chars');

        const key = await getProviderApiKey('gemini');
        assert.strictEqual(key, 'sk-valid_config_api_key_more_than_20_chars', 'Should reject malformed long env key containing spaces');
        console.log('✅ Test 7 PASSED: Malformed Long ENV Key');
        passed++;
    } catch (e) {
        console.log('❌ Test 7 FAILED:', e.message);
        failed++;
    }

    // Case 8: Wrong prefix but long key
    try {
        clearEnv();
        process.env.OPENAI_API_KEY = 'AIzaSy_this_is_a_gemini_key_but_long';
        await setupConfig('openai', 'sk-valid_config_api_key_more_than_20_chars');

        const key = await getProviderApiKey('openai');
        assert.strictEqual(key, 'sk-valid_config_api_key_more_than_20_chars', 'Should fail for OpenAI and fall back to config');
        console.log('✅ Test 8 PASSED: Wrong prefix but long key');
        passed++;
    } catch (e) {
        console.log('❌ Test 8 FAILED:', e.message);
        failed++;
    }

    // Case 9: Wrong prefix casing (case-sensitivity check)
    try {
        clearEnv();
        process.env.OPENAI_API_KEY = 'SK-valid_openai_api_key_more_than_20_chars';
        await setupConfig('openai', 'sk-valid_config_api_key_more_than_20_chars');

        const key = await getProviderApiKey('openai');
        assert.strictEqual(key, 'sk-valid_config_api_key_more_than_20_chars', 'Should reject casing-mismatched prefix and fall back');
        console.log('✅ Test 9 PASSED: Prefix Case Sensitivity');
        passed++;
    } catch (e) {
        console.log('❌ Test 9 FAILED:', e.message);
        failed++;
    }

    // Case 10: Leading/trailing whitespace
    try {
        clearEnv();
        process.env.OPENAI_API_KEY = '   sk-valid_openai_api_key_more_than_20_chars   ';
        await setupConfig('openai', 'config_key_that_should_be_ignored');

        const key = await getProviderApiKey('openai');
        assert.strictEqual(key, 'sk-valid_openai_api_key_more_than_20_chars', 'Should accept and resolve key with whitespace');
        console.log('✅ Test 10 PASSED: Leading/Trailing Whitespace Trimming');
        passed++;
    } catch (e) {
        console.log('❌ Test 10 FAILED:', e.message);
        failed++;
    }

    // Case 11: Extremely long malicious string
    try {
        clearEnv();
        process.env.OPENAI_API_KEY = 'sk-' + 'A'.repeat(500);
        await setupConfig('openai', 'sk-valid_config_api_key_more_than_20_chars');

        const key = await getProviderApiKey('openai');
        assert.strictEqual(key, 'sk-valid_config_api_key_more_than_20_chars', 'Should reject excessively long key');
        console.log('✅ Test 11 PASSED: Extremely Long Key');
        passed++;
    } catch (e) {
        console.log('❌ Test 11 FAILED:', e.message);
        failed++;
    }

    // Restore original state
    clearEnv();
    restoreEnv();
    cleanUp();

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log(`Test Results: ${passed} passed, ${failed} failed`);
    console.log('='.repeat(50));

    if (failed === 0) {
        console.log('✨ All resolveApiKey tests passed! ✨');
        process.exit(0);
    } else {
        process.exit(1);
    }
}

await runTests();
