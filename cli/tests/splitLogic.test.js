import { groupFilesHeuristic } from '../helpers/splitLogic.js';

console.log('Running groupFilesHeuristic unit tests...');
let passed = 0, failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ ${message}`);
    passed++;
  } else {
    console.log(`❌ ${message}`);
    failed++;
  }
}

// Test: maxGroups cap is respected even when non-source categories exhaust the budget
const filesData = {
  files: [
    { path: 'README.md' },
    { path: 'test/foo.test.js' },
    { path: 'package.json' },
    { path: 'a/one.js' },
    { path: 'b/two.js' },
    { path: 'c/three.js' },
  ]
};

const groups = groupFilesHeuristic(filesData, 3);
assert(groups.length <= 3, `groups.length (${groups.length}) should be <= maxGroups (3)`);

const allFiles = groups.flatMap(g => g.files);
assert(allFiles.length === filesData.files.length, 'all input files are present in the output groups');

console.log('='.repeat(50));
console.log(`Test Results: ${passed} passed, ${failed} failed`);
console.log('='.repeat(50));
if (failed > 0) process.exit(1);
console.log('✨ All splitLogic tests passed! ✨');
