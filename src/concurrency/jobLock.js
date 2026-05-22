/**
 * jobLock.js
 * Prevents overlapping execution of the same cron job.
 */

const activeLocks = new Map();

/**
 * Attempt to acquire a lock for a given job name.
 * Returns true if the lock was acquired, false if already locked.
 * @param {string} jobName
 * @returns {boolean}
 */
function acquireLock(jobName) {
  if (activeLocks.get(jobName)) {
    return false;
  }
  activeLocks.set(jobName, {
    acquiredAt: new Date().toISOString(),
    pid: process.pid,
  });
  return true;
}

/**
 * Release the lock for a given job name.
 * @param {string} jobName
 */
function releaseLock(jobName) {
  activeLocks.delete(jobName);
}

/**
 * Check whether a job is currently locked.
 * @param {string} jobName
 * @returns {boolean}
 */
function isLocked(jobName) {
  return activeLocks.has(jobName);
}

/**
 * Get lock metadata for a job, or null if not locked.
 * @param {string} jobName
 * @returns {{ acquiredAt: string, pid: number } | null}
 */
function getLockInfo(jobName) {
  return activeLocks.get(jobName) || null;
}

/**
 * Clear all locks — useful for testing or emergency resets.
 */
function clearAllLocks() {
  activeLocks.clear();
}

module.exports = { acquireLock, releaseLock, isLocked, getLockInfo, clearAllLocks };
