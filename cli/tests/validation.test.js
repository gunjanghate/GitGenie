import { validateRemoteUrl } from '../helpers/gitUtils.js';
import { GeminiProvider } from '../providers/gemini.js';

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

const gemini = new GeminiProvider('AIzaSyDummyKeyForConstructorOnly123456');

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

run('accepts valid HTTPS remote URL', () => {
    assert(validateRemoteUrl('https://github.com/user/repo.git') === true);
});

run('accepts valid SSH remote URL', () => {
    assert(validateRemoteUrl('git@github.com:user/repo.git') === true);
});

run('accepts HTTPS URL with port and without .git suffix', () => {
    assert(validateRemoteUrl('https://github.com:443/user/repo') === true);
    assert(validateRemoteUrl('https://gitlab.com/user/repo') === true);
});

run('accepts ssh:// and alternate scp-style SSH URLs', () => {
    assert(validateRemoteUrl('ssh://git@github.com/user/repo.git') === true);
    assert(validateRemoteUrl('ssh://git@github.com/user/repo') === true);
    assert(validateRemoteUrl('git@github.com:user/repo') === true);
});

run('rejects empty remote URL', () => {
    assert(validateRemoteUrl('') !== true);
    assert(validateRemoteUrl('   ') !== true);
});

run('rejects incomplete SSH prefix', () => {
    assert(validateRemoteUrl('git@') !== true);
});

run('rejects malformed HTTPS URL', () => {
    assert(validateRemoteUrl('https:') !== true);
});

run('rejects arbitrary long strings as Gemini keys', () => {
    assert(gemini.validateApiKey('thisisnotavalidkey123') === false);
});

run('accepts valid Gemini API key format', () => {
    assert(gemini.validateApiKey('AIzaSyDummyKeyForValidation123456') === true);
});

run('rejects Gemini keys with wrong prefix', () => {
    assert(gemini.validateApiKey('AIzaDummyKeyWithoutSySuffix12345') === false);
});

if (failed > 0) {
    process.exit(1);
}

console.log(`\n${passed} passed, ${failed} failed`);
