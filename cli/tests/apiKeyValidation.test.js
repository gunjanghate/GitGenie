import { validateApiKey } from '../utils/resolveApiKey.js';

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

let passed = 0;
let failed = 0;

function run(name, fn) {
    try {
        fn();
        console.log(`✓ ${name}`);
        passed++;
    } catch (err) {
        console.error(`✗ ${name}: ${err.message}`);
        failed++;
    }
}

// Test empty string rejection
run('rejects empty API key string', () => {
    assert(validateApiKey('gemini', '') === null);
});

// Test whitespace-only rejection
run('rejects whitespace-only API key', () => {
    assert(validateApiKey('gemini', '   ') === null);
});

run('rejects API key with only tabs', () => {
    assert(validateApiKey('gemini', '\t\t\t') === null);
});

run('rejects API key with only newlines', () => {
    assert(validateApiKey('gemini', '\n\n\n') === null);
});

// Test null and undefined rejection
run('rejects null API key', () => {
    assert(validateApiKey('gemini', null) === null);
});

run('rejects undefined API key', () => {
    assert(validateApiKey('gemini', undefined) === null);
});

run('rejects non-string API key', () => {
    assert(validateApiKey('gemini', 123) === null);
});

// Test valid key acceptance
run('accepts valid Gemini API key', () => {
    const result = validateApiKey('gemini', 'AIzaSyDummyKeyForValidation123456');
    assert(result !== null);
});

run('trims whitespace from valid key', () => {
    const result = validateApiKey('gemini', '  AIzaSyDummyKeyForValidation123456  ');
    assert(result === 'AIzaSyDummyKeyForValidation123456');
});

// Test key length validation
run('rejects API key that exceeds maximum length', () => {
    const longKey = 'AIzaSy' + 'a'.repeat(195);
    assert(validateApiKey('gemini', longKey) === null);
});

// Test provider-specific validation
run('accepts valid Groq API key format', () => {
    const result = validateApiKey('groq', 'gsk_DummyKeyWithValidFormat1234567890');
    assert(result !== null);
});

run('rejects invalid Groq API key prefix', () => {
    assert(validateApiKey('groq', 'AIzaSyDummyKeyForValidation123456') === null);
});

run('accepts valid OpenAI API key format', () => {
    const result = validateApiKey('openai', 'sk-DummyKeyWithValidFormat1234567890');
    assert(result !== null);
});

// Test invalid character rejection
run('rejects API key with special characters not in allowlist', () => {
    assert(validateApiKey('gemini', 'AIzaSy@invalid#key$here') === null);
});

if (failed > 0) {
    process.exit(1);
}

console.log(`\n${passed} passed, ${failed} failed`);
