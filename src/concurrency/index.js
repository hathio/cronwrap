/**
 * concurrency/index.js
 * Public API for the concurrency module.
 */

const { acquireLock, releaseLock, isLocked, getLockInfo, clearAllLocks } = require('./jobLock');
const { createConcurrencyMiddleware } = require('./concurrencyMiddleware');

module.exports = {
  acquireLock,
  releaseLock,
  isLocked,
  getLockInfo,
  clearAllLocks,
  createConcurrencyMiddleware,
};
