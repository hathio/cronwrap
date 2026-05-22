/**
 * Job timeout management — wraps a job function with a configurable timeout.
 * If the job doesn't complete in time, it rejects with a TimeoutError.
 */

class TimeoutError extends Error {
  constructor(jobName, ms) {
    super(`Job "${jobName}" timed out after ${ms}ms`);
    this.name = 'TimeoutError';
    this.jobName = jobName;
    this.timeoutMs = ms;
  }
}

/**
 * Wraps a job function with a timeout.
 * @param {Function} fn - async job function
 * @param {number} ms - timeout in milliseconds
 * @param {string} jobName - name used in error messages
 * @returns {Function} wrapped function
 */
function withTimeout(fn, ms, jobName = 'unknown') {
  if (typeof fn !== 'function') throw new TypeError('fn must be a function');
  if (typeof ms !== 'number' || ms <= 0) throw new RangeError('ms must be a positive number');

  return async function (...args) {
    let timer;
    const timeoutPromise = new Promise((_, reject) => {
      timer = setTimeout(() => {
        reject(new TimeoutError(jobName, ms));
      }, ms);
    });

    try {
      const result = await Promise.race([fn(...args), timeoutPromise]);
      return result;
    } finally {
      clearTimeout(timer);
    }
  };
}

/**
 * Creates a timeout middleware for the job middleware pipeline.
 * @param {number} ms - timeout in milliseconds
 * @returns {Function} middleware
 */
function createTimeoutMiddleware(ms) {
  if (typeof ms !== 'number' || ms <= 0) throw new RangeError('ms must be a positive number');

  return async function timeoutMiddleware(ctx, next) {
    const wrapped = withTimeout(next, ms, ctx.jobName || 'unknown');
    await wrapped();
  };
}

module.exports = { withTimeout, createTimeoutMiddleware, TimeoutError };
