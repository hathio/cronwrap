/**
 * Middleware that injects job tags into the context for downstream use
 */

const { getTags } = require('./jobTags');

/**
 * Creates middleware that attaches tags to the job context
 * Tags can be used by alert handlers, metrics, or logging
 * @returns {Function} middleware function
 */
function createTagMiddleware() {
  return async function tagMiddleware(context, next) {
    const { jobName } = context;
    context.tags = getTags(jobName);
    await next();
  };
}

module.exports = { createTagMiddleware };
