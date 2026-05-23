const { setPriority, getPriority } = require('./jobPriority');

/**
 * Middleware that attaches priority info to the job context
 * and optionally sets a priority level for the job.
 *
 * Usage:
 *   createPriorityMiddleware('high')
 *   createPriorityMiddleware() // defaults to 'normal'
 */
function createPriorityMiddleware(level = 'normal') {
  return async function priorityMiddleware(ctx, next) {
    const jobId = ctx.jobId;
    if (!jobId) {
      return next();
    }

    // Register priority for this job
    setPriority(jobId, level);

    // Attach priority info to context so downstream middleware can inspect it
    ctx.priority = getPriority(jobId);

    try {
      await next();
    } finally {
      // Keep priority registered after run so scheduler can use it
    }
  };
}

module.exports = { createPriorityMiddleware };
