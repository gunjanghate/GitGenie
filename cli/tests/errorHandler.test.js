/**
 * Unit Tests for errorHandler.js
 * 
 * These tests verify that the error handler correctly detects and formats
 * Gemini API errors with user-friendly messages.
 * 
 * To run these tests manually with Node.js: node tests/errorHandler.test.js
 */

import { parseGeminiError, ErrorType } from '../helpers/errorHandler.js';
import assert from 'assert';

// Test helper to create mock errors
function createMockError(message, code = null, status = null) {
    const error = new Error(message);
    if (code) error.code = code;
    if (status) error.status = status;
    return error;
}

// Test suite
function runTests() {
    console.log('Running errorHandler.js unit tests...\n');
    let passed = 0;
    let failed = 0;

    // Test 1: Detect quota exceeded error
    try {
        const error = createMockError('GoogleGenerativeAI Error: Error fetching from https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent: [429 Too Many Requests] You exceeded your current quota, please check your plan and billing details.');
        const result = parseGeminiError(error);

        assert.strictEqual(result.type, ErrorType.QUOTA_EXCEEDED);
        assert(result.message.includes('quota'));
        assert(result.helpfulAction.includes('free tier'));

        console.log('✅ Test 1 PASSED: Detect quota exceeded error');
        passed++;
    } catch (e) {
        console.log('❌ Test 1 FAILED:', e.message);
        failed++;
    }

    // Test 2: Detect rate limit error
    try {
        const error = createMockError('Rate limit exceeded', null, 429);
        const result = parseGeminiError(error);

        assert.strictEqual(result.type, ErrorType.RATE_LIMIT);
        assert(result.message.includes('rate limit'));
        assert(result.helpfulAction.includes('wait'));

        console.log('✅ Test 2 PASSED: Detect rate limit error');
        passed++;
    } catch (e) {
        console.log('❌ Test 2 FAILED:', e.message);
        failed++;
    }

    // Test 3: Detect invalid API key error (401)
    try {
        const error = createMockError('Invalid API key', null, 401);
        const result = parseGeminiError(error);

        assert.strictEqual(result.type, ErrorType.INVALID_API_KEY);
        assert(result.message.includes('Invalid'));
        assert(result.helpfulAction.includes('gg config'));

        console.log('✅ Test 3 PASSED: Detect invalid API key error (401)');
        passed++;
    } catch (e) {
        console.log('❌ Test 3 FAILED:', e.message);
        failed++;
    }

    // Test 4: Detect invalid API key error (403)
    try {
        const error = createMockError('API key not valid. Please pass a valid API key.', null, 403);
        const result = parseGeminiError(error);

        assert.strictEqual(result.type, ErrorType.INVALID_API_KEY);
        assert(result.message.includes('Invalid'));

        console.log('✅ Test 4 PASSED: Detect invalid API key error (403)');
        passed++;
    } catch (e) {
        console.log('❌ Test 4 FAILED:', e.message);
        failed++;
    }

    // Test 5: Detect network timeout error
    try {
        const error = createMockError('Request timeout', 'ETIMEDOUT');
        const result = parseGeminiError(error);

        assert.strictEqual(result.type, ErrorType.NETWORK_ERROR);
        assert(result.message.includes('network'));
        assert(result.helpfulAction.includes('connection'));

        console.log('✅ Test 5 PASSED: Detect network timeout error');
        passed++;
    } catch (e) {
        console.log('❌ Test 5 FAILED:', e.message);
        failed++;
    }

    // Test 6: Detect network connection refused error
    try {
        const error = createMockError('Connection refused', 'ECONNREFUSED');
        const result = parseGeminiError(error);

        assert.strictEqual(result.type, ErrorType.NETWORK_ERROR);

        console.log('✅ Test 6 PASSED: Detect network connection refused error');
        passed++;
    } catch (e) {
        console.log('❌ Test 6 FAILED:', e.message);
        failed++;
    }

    // Test 7: Detect generic API error
    try {
        const error = createMockError('GoogleGenerativeAI Error: Something went wrong');
        const result = parseGeminiError(error);

        assert.strictEqual(result.type, ErrorType.GENERIC_API_ERROR);
        assert(result.message.includes('API error'));

        console.log('✅ Test 7 PASSED: Detect generic API error');
        passed++;
    } catch (e) {
        console.log('❌ Test 7 FAILED:', e.message);
        failed++;
    }

    // Test 8: Handle unknown error gracefully
    try {
        const error = createMockError('Completely unexpected error message');
        const result = parseGeminiError(error);

        assert.strictEqual(result.type, ErrorType.UNKNOWN_ERROR);
        assert(result.message.includes('unexpectedly'));
        assert(result.helpfulAction.length > 0);

        console.log('✅ Test 8 PASSED: Handle unknown error gracefully');
        passed++;
    } catch (e) {
        console.log('❌ Test 8 FAILED:', e.message);
        failed++;
    }

    // Test 9: Return correct structure for all errors
    try {
        const error = createMockError('Test error');
        const result = parseGeminiError(error);

        assert(result.hasOwnProperty('type'));
        assert(result.hasOwnProperty('message'));
        assert(result.hasOwnProperty('helpfulAction'));
        assert(result.hasOwnProperty('originalError'));
        assert.strictEqual(result.originalError, error);

        console.log('✅ Test 9 PASSED: Return correct structure for all errors');
        passed++;
    } catch (e) {
        console.log('❌ Test 9 FAILED:', e.message);
        failed++;
    }

    // Test 10: Detect quota exceeded with resource_exhausted
    try {
        const error = createMockError('resource_exhausted: You have exceeded your quota');
        const result = parseGeminiError(error);

        assert.strictEqual(result.type, ErrorType.QUOTA_EXCEEDED);

        console.log('✅ Test 10 PASSED: Detect quota exceeded with resource_exhausted');
        passed++;
    } catch (e) {
        console.log('❌ Test 10 FAILED:', e.message);
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
