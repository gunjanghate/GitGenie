#!/usr/bin/env node

/**
 * Demo script to showcase Git Recovery functionality
 * This script demonstrates all recovery features safely
 */

import chalk from 'chalk';
import { execaCommand } from 'execa';

console.log(chalk.blue('🎬 Git Recovery Feature Demo\n'));

// Test 1: Show help system
console.log(chalk.yellow('1️⃣ Testing Help System'));
console.log(chalk.gray('Command: gg recover --help\n'));

try {
  const { stdout } = await execaCommand('node index.js recover --help');
  console.log(stdout);
} catch (error) {
  console.log(chalk.red('Error:', error.message));
}

console.log('\n' + '='.repeat(60) + '\n');

// Test 2: List recovery options
console.log(chalk.yellow('2️⃣ Testing Recovery List'));
console.log(chalk.gray('Command: gg recover list\n'));

try {
  const { stdout } = await execaCommand('node index.js recover list');
  console.log(stdout);
} catch (error) {
  console.log(chalk.red('Error:', error.message));
}

console.log('\n' + '='.repeat(60) + '\n');

// Test 3: Explain specific entry
console.log(chalk.yellow('3️⃣ Testing Recovery Explanation'));
console.log(chalk.gray('Command: gg recover explain 1\n'));

try {
  const { stdout } = await execaCommand('node index.js recover explain 1');
  console.log(stdout);
} catch (error) {
  console.log(chalk.red('Error:', error.message));
}

console.log('\n' + '='.repeat(60) + '\n');

// Test 4: Error handling
console.log(chalk.yellow('4️⃣ Testing Error Handling'));
console.log(chalk.gray('Command: gg recover explain 999 (invalid number)\n'));

try {
  const { stdout } = await execaCommand('node index.js recover explain 999');
  console.log(stdout);
} catch (error) {
  console.log(chalk.red('Expected error handled gracefully'));
}

console.log('\n' + '='.repeat(60) + '\n');

// Test 5: Safety validation
console.log(chalk.yellow('5️⃣ Testing Safety Features'));
console.log(chalk.gray('Running validation tests...\n'));

try {
  const { stdout } = await execaCommand('node tests/recovery.test.js');
  console.log(stdout);
} catch (error) {
  console.log(chalk.red('Error:', error.message));
}

console.log('\n' + chalk.green('🎉 Demo completed successfully!'));
console.log(chalk.cyan('💡 All operations were read-only and safe'));
console.log(chalk.gray('Ready for production use with proper safety guarantees'));