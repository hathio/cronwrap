/**
 * concurrencyMiddleware.js
 * Middleware that skips job execution if a lock is already held.
 */

const { acquireLock, releaseLock, isLocked } = require('./jobLock');

/**
 * Creates a middleware function that enforces single-instance execution
 * for a named job. If the job is already running, it skips execution
 * and optionally calls an onSkip callback.
 *
 * @param {string} jobName
 * @param {{ onSkip?: (jobName: string) => void }} [options]
 * @returns {Function} middleware
 */
function createConcurrencyMiddleware(jobName, options = {}) {
  const { onSkip } = options;

  return async function concurrencyMiddleware(context, next) {
    if (isLocked(jobName)) {
      const msg = `[concurrency] Skipping "${jobName}" — already running`;
      console.warn(msg);
      if (typeof onSkip === 'function') {
        onSkip(jobName);
      }
      context.skipped = true;
      context.skipReason = 'locked';
      return;
    }

    const acquired = acquireLock(jobName);
    if (!acquired) {
      // Race condition guard
      context.skipped = true;
      context.skipReason = 'locked';
      return;
    }

    try {
      await next();
    } finally {
      releaseLock(jobName);
    }
  };
}

module.exports = { createConcurrencyMiddleware };
