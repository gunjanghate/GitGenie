import { execaCommand } from 'execa';
import chalk from 'chalk';

/**
 * Creates a new branch from a given commit hash - SAFE operation
 * Does NOT checkout, reset, or use force flags
 * @param {string} commitHash - The commit hash to create branch from
 * @param {string} branchName - Optional custom branch name
 * @returns {Promise<string>} The created branch name
 */
export async function createRecoveryBranch(commitHash, branchName = null) {
  // Validate inputs
  if (!commitHash || typeof commitHash !== 'string') {
    throw new Error('Commit hash is required and must be a string');
  }

  // Generate timestamp-based branch name if not provided
  const timestamp = new Date().toISOString()
    .replace(/[:.]/g, '-')
    .replace('T', '-')
    .substring(0, 19);
  
  const finalBranchName = branchName || `recovery-${timestamp}`;

  try {
    // Verify the commit exists (READ ONLY check)
    await execaCommand(`git cat-file -e ${commitHash}`);
    
    // Create branch from commit hash - SAFE: no checkout, no reset, no force
    await execaCommand(`git branch ${finalBranchName} ${commitHash}`);
    
    console.log(chalk.green(`✅ Created recovery branch: ${finalBranchName}`));
    console.log(chalk.gray(`   From commit: ${commitHash}`));
    
    return finalBranchName;
  } catch (error) {
    if (error.message.includes('already exists')) {
      throw new Error(`Branch "${finalBranchName}" already exists. Choose a different name.`);
    }
    if (error.message.includes('not a valid object')) {
      throw new Error(`Commit "${commitHash}" does not exist or is invalid.`);
    }
    throw new Error(`Failed to create branch: ${error.message}`);
  }
}

/**
 * Cherry-pick commits to a branch - SAFE when used with new branches
 * @param {string} targetBranch - Branch to cherry-pick to
 * @param {Array<string>} commitHashes - Array of commit hashes to cherry-pick
 * @returns {Promise<void>}
 */
export async function cherryPickToBranch(targetBranch, commitHashes) {
  if (!Array.isArray(commitHashes) || commitHashes.length === 0) {
    throw new Error('Commit hashes array is required and must not be empty');
  }

  try {
    // Switch to target branch (SAFE: no force)
    await execaCommand(`git checkout ${targetBranch}`);
    
    // Cherry-pick each commit
    for (const hash of commitHashes) {
      try {
        await execaCommand(`git cherry-pick ${hash}`);
        console.log(chalk.green(`✅ Applied commit: ${hash.substring(0, 8)}`));
      } catch (error) {
        if (error.message.includes('conflict')) {
          console.log(chalk.yellow(`⚠️  Conflict applying ${hash.substring(0, 8)}`));
          console.log(chalk.cyan('Resolve conflicts and run: git cherry-pick --continue'));
          throw new Error('Cherry-pick conflict - manual resolution required');
        }
        throw error;
      }
    }
  } catch (error) {
    throw new Error(`Cherry-pick failed: ${error.message}`);
  }
}

/**
 * Get information about a commit - READ ONLY operation
 * @param {string} commitHash - The commit hash to inspect
 * @returns {Promise<Object>} Commit information
 */
export async function getCommitInfo(commitHash) {
  try {
    // Get commit details (READ ONLY)
    const { stdout: commitInfo } = await execaCommand(
      `git show --format=%H|%an|%ae|%ad|%s --name-only ${commitHash}`
    );
    
    const lines = commitInfo.trim().split('\n');
    const [hash, author, email, date, subject] = lines[0].split('|');
    const files = lines.slice(1).filter(line => line.trim());
    
    return {
      hash: hash?.substring(0, 8) || 'unknown',
      fullHash: hash || 'unknown',
      author: author || 'unknown',
      email: email || 'unknown',
      date: date || 'unknown',
      subject: subject || 'No subject',
      files: files || []
    };
  } catch (error) {
    throw new Error(`Failed to get commit info: ${error.message}`);
  }
}

/**
 * Check if a branch name is valid and available
 * @param {string} branchName - Branch name to validate
 * @returns {Promise<boolean>} true if valid and available
 */
export async function validateBranchName(branchName) {
  if (!branchName || typeof branchName !== 'string') {
    return false;
  }

  // Check for invalid characters
  const invalidChars = /[~^:?*[\\\s]/;
  if (invalidChars.test(branchName)) {
    return false;
  }

  try {
    // Check if branch already exists
    await execaCommand(`git show-ref --verify refs/heads/${branchName}`);
    return false; // Branch exists
  } catch {
    return true; // Branch doesn't exist, name is available
  }
}