/**
 * Middleware that enforces rate limits on job execution.
 */

const { checkRateLimit, recordRun } = require('./jobRateLimit');

function createRateLimitMiddleware(jobId) {
  return async function rateLimitMiddleware(context, next) {
    const result = checkRateLimit(jobId);

    if (!result.allowed) {
      const resetIn = result.resetAt
        ? Math.ceil((result.resetAt - Date.now()) / 1000)
        : '?';
      const err = new Error(
        `Rate limit exceeded for job "${jobId}". Resets in ${resetIn}s.`
      );
      err.code = 'RATE_LIMIT_EXCEEDED';
      err.resetAt = result.resetAt;
      throw err;
    }

    recordRun(jobId);
    context.rateLimit = { remaining: result.remaining - 1 };
    await next();
  };
}

module.exports = { createRateLimitMiddleware };
