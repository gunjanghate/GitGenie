// Simple test to verify undo functions work correctly
import {
    getRecentCommits,
    checkWorkingDirectoryStatus,
    validateUndoCount
} from '../helpers/undoLogic.js';
import { validateCommitCount } from '../helpers/undoErrors.js';

console.log('🧪 Testing GitGenie Undo Functionality\n');

// Test 1: Get recent commits (read-only operation)
console.log('Test 1: Getting recent commits...');
try {
    const commits = await getRecentCommits(5);
    if (commits.length > 0) {
        console.log(`✅ Found ${commits.length} recent commits`);
        console.log(`   First commit: ${commits[0].hash} - ${commits[0].message}`);
    } else {
        console.log('⚠️  No commits found (repository may be empty)');
    }
} catch (error) {
    console.log(`❌ Error: ${error.message}`);
}

// Test 2: Check working directory status
console.log('\nTest 2: Checking working directory status...');
try {
    const hasChanges = await checkWorkingDirectoryStatus();
    console.log(`✅ Working directory check: ${hasChanges ? 'Has uncommitted changes' : 'Clean'}`);
} catch (error) {
    console.log(`❌ Error: ${error.message}`);
}

// Test 3: Validate commit count logic
console.log('\nTest 3: Testing commit count validation...');
const testCases = [
    { count: 1, max: 10, shouldPass: true },
    { count: 5, max: 10, shouldPass: true },
    { count: 10, max: 10, shouldPass: true },
    { count: 11, max: 10, shouldPass: false },
    { count: 0, max: 10, shouldPass: false },
    { count: -1, max: 10, shouldPass: false }
];

testCases.forEach(({ count, max, shouldPass }) => {
    try {
        validateCommitCount(count, max);
        if (shouldPass) {
            console.log(`✅ Valid: count=${count}, max=${max}`);
        } else {
            console.log(`❌ Should have failed: count=${count}, max=${max}`);
        }
    } catch (error) {
        if (!shouldPass) {
            console.log(`✅ Correctly rejected: count=${count}, max=${max}`);
        } else {
            console.log(`❌ Should have passed: count=${count}, max=${max}`);
        }
    }
});

// Test 4: Validate undo count against repository
console.log('\nTest 4: Validating undo count against repository...');
try {
    await validateUndoCount(1);
    console.log('✅ Undo count validation passed for n=1');
} catch (error) {
    console.log(`⚠️  Validation check: ${error.message}`);
}

console.log('\n🎉 Undo system tests completed');
console.log('💡 All validation operations are read-only and safe');
console.log('💡 Run "gg undo" in a Git repository to test interactive mode');
