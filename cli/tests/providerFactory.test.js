/**
 * Unit Tests for ProviderFactory
 * 
 * These tests verify that the provider factory correctly manages
 * AI provider registration and instantiation.
 * 
 * To run these tests manually with Node.js: node tests/providerFactory.test.js
 */

import { ProviderFactory } from '../providers/index.js';
import assert from 'assert';

// Test suite
function runTests() {
    console.log('Running ProviderFactory unit tests...\n');
    let passed = 0;
    let failed = 0;

    // Test 1: Get supported providers
    try {
        const providers = ProviderFactory.getSupportedProviders();

        assert(Array.isArray(providers), 'getSupportedProviders should return an array');
        assert(providers.includes('gemini'), 'Should support gemini provider');
        assert(providers.includes('mistral'), 'Should support mistral provider');
        assert(providers.includes('groq'), 'Should support groq provider');
        assert.strictEqual(providers.length, 3, 'Should have exactly 3 providers');

        console.log('✅ Test 1 PASSED: Get supported providers');
        passed++;
    } catch (e) {
        console.log('❌ Test 1 FAILED:', e.message);
        failed++;
    }

    // Test 2: Get default provider
    try {
        const defaultProvider = ProviderFactory.getDefaultProvider();

        assert.strictEqual(defaultProvider, 'gemini', 'Default provider should be gemini');

        console.log('✅ Test 2 PASSED: Get default provider');
        passed++;
    } catch (e) {
        console.log('❌ Test 2 FAILED:', e.message);
        failed++;
    }

    // Test 3: Check if provider is supported (valid)
    try {
        assert.strictEqual(ProviderFactory.isProviderSupported('gemini'), true);
        assert.strictEqual(ProviderFactory.isProviderSupported('mistral'), true);
        assert.strictEqual(ProviderFactory.isProviderSupported('groq'), true);
        assert.strictEqual(ProviderFactory.isProviderSupported('GEMINI'), true, 'Should be case-insensitive');

        console.log('✅ Test 3 PASSED: Check if provider is supported (valid)');
        passed++;
    } catch (e) {
        console.log('❌ Test 3 FAILED:', e.message);
        failed++;
    }

    // Test 4: Check if provider is supported (invalid)
    try {
        assert.strictEqual(ProviderFactory.isProviderSupported('openai'), false);
        assert.strictEqual(ProviderFactory.isProviderSupported('claude'), false);
        assert.strictEqual(ProviderFactory.isProviderSupported('invalid'), false);

        console.log('✅ Test 4 PASSED: Check if provider is supported (invalid)');
        passed++;
    } catch (e) {
        console.log('❌ Test 4 FAILED:', e.message);
        failed++;
    }

    // Test 5: Get provider throws error for unknown provider
    try {
        let errorThrown = false;
        try {
            ProviderFactory.getProvider('unknown', 'test-key');
        } catch (err) {
            errorThrown = true;
            assert(err.message.includes('Unknown provider'), 'Error message should mention unknown provider');
            assert(err.message.includes('gemini'), 'Error message should list supported providers');
        }

        assert(errorThrown, 'Should throw error for unknown provider');

        console.log('✅ Test 5 PASSED: Get provider throws error for unknown provider');
        passed++;
    } catch (e) {
        console.log('❌ Test 5 FAILED:', e.message);
        failed++;
    }

    // Test 6: Instantiate Gemini provider
    try {
        const provider = ProviderFactory.getProvider('gemini', 'test-api-key');

        assert(provider !== null, 'Provider should not be null');
        assert(typeof provider.generateCommitMessage === 'function', 'Provider should have generateCommitMessage method');

        console.log('✅ Test 6 PASSED: Instantiate Gemini provider');
        passed++;
    } catch (e) {
        console.log('❌ Test 6 FAILED:', e.message);
        failed++;
    }

    // Test 7: Instantiate Mistral provider
    try {
        const provider = ProviderFactory.getProvider('mistral', 'test-api-key');

        assert(provider !== null, 'Provider should not be null');
        assert(typeof provider.generateCommitMessage === 'function', 'Provider should have generateCommitMessage method');

        console.log('✅ Test 7 PASSED: Instantiate Mistral provider');
        passed++;
    } catch (e) {
        console.log('❌ Test 7 FAILED:', e.message);
        failed++;
    }

    // Test 8: Instantiate Groq provider
    try {
        const provider = ProviderFactory.getProvider('groq', 'test-api-key');

        assert(provider !== null, 'Provider should not be null');
        assert(typeof provider.generateCommitMessage === 'function', 'Provider should have generateCommitMessage method');

        console.log('✅ Test 8 PASSED: Instantiate Groq provider');
        passed++;
    } catch (e) {
        console.log('❌ Test 8 FAILED:', e.message);
        failed++;
    }

    // Test 9: Provider name is case-insensitive
    try {
        const provider1 = ProviderFactory.getProvider('GEMINI', 'test-key');
        const provider2 = ProviderFactory.getProvider('Gemini', 'test-key');
        const provider3 = ProviderFactory.getProvider('gemini', 'test-key');

        assert(provider1 !== null, 'GEMINI should work');
        assert(provider2 !== null, 'Gemini should work');
        assert(provider3 !== null, 'gemini should work');

        console.log('✅ Test 9 PASSED: Provider name is case-insensitive');
        passed++;
    } catch (e) {
        console.log('❌ Test 9 FAILED:', e.message);
        failed++;
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log(`Test Results: ${passed} passed, ${failed} failed`);
    console.log('='.repeat(50));

    if (failed === 0) {
        console.log('✨ All tests passed! ✨');
        process.exit(0);
    } else {
        console.log('⚠️  Some tests failed. Please review the failures above.');
        process.exit(1);
    }
}

// Run tests if this file is executed directly
runTests();
