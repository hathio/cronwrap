/**
 * Middleware that enforces throttle rules for a job.
 */

const { checkThrottle, getThrottle } = require('./jobThrottle');

/**
 * @param {object} options
 * @param {number} [options.maxRuns=1] - max runs allowed in the window
 * @returns {function} middleware function
 */
function createThrottleMiddleware(options = {}) {
  const { maxRuns = 1 } = options;

  return async function throttleMiddleware(context, next) {
    const { jobName } = context;

    const throttle = getThrottle(jobName);
    if (!throttle) {
      // No throttle configured for this job — pass through
      return next();
    }

    const allowed = checkThrottle(jobName, maxRuns);

    if (!allowed) {
      const msg = `Job "${jobName}" throttled — exceeded ${maxRuns} run(s) within ${throttle.windowMs}ms window`;
      context.throttled = true;
      context.throttleMessage = msg;
      console.warn(`[throttle] ${msg}`);
      return;
    }

    return next();
  };
}

module.exports = { createThrottleMiddleware };
