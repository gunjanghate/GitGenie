import { execaCommand } from 'execa';

/**
 * Runs git reflog and parses commit hash and action
 * @param {number} count - Number of reflog entries to retrieve (default: 20)
 * @returns {Promise<Array>} Array of reflog entries with hash, action, message, and timestamp
 */
export async function parseReflog(count = 20) {
  try {
    // Run git reflog with specified count - READ ONLY operation
    const { stdout } = await execaCommand(`git reflog -n ${count} --format=%H|%gd|%gs|%cr`);
    
    if (!stdout.trim()) {
      return [];
    }

    const entries = stdout.trim().split('\n').map(line => {
      const [hash, ref, message, timestamp] = line.split('|');
      
      // Extract action from reflog message (e.g., "commit", "reset", "checkout")
      let action = 'unknown';
      if (message) {
        if (message.includes('commit:')) action = 'commit';
        else if (message.includes('reset:')) action = 'reset';
        else if (message.includes('checkout:')) action = 'checkout';
        else if (message.includes('merge:')) action = 'merge';
        else if (message.includes('rebase:')) action = 'rebase';
        else if (message.includes('cherry-pick:')) action = 'cherry-pick';
        else if (message.includes('pull:')) action = 'pull';
      }

      return {
        hash: hash?.substring(0, 8) || 'unknown',
        fullHash: hash || 'unknown',
        ref: ref || 'unknown',
        action,
        message: message || 'No message',
        timestamp: timestamp || 'unknown'
      };
    });

    return entries;
  } catch (error) {
    // Handle common error cases
    if (error.message.includes('not a git repository')) {
      throw new Error('Not a git repository');
    }
    if (error.message.includes('does not have any commits yet')) {
      throw new Error('Repository has no commits yet');
    }
    throw new Error(`Failed to read reflog: ${error.message}`);
  }
}

/**
 * Get potentially recoverable commits (lost commits from reset/rebase)
 * @param {number} count - Number of reflog entries to scan
 * @returns {Promise<Array>} Array of potentially lost commits
 */
export async function findLostCommits(count = 50) {
  try {
    const entries = await parseReflog(count);
    
    // Filter for potentially lost commits (commits that were reset away or rebased out)
    const lostCommits = entries.filter(entry => {
      return entry.action === 'reset' || 
             entry.action === 'rebase' || 
             (entry.action === 'commit' && entry.message.includes('amend'));
    });

    return lostCommits;
  } catch (error) {
    throw error;
  }
}