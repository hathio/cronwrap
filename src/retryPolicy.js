/**
 * Retry policy configuration and execution for failed cron jobs.
 */

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_BACKOFF_MS = 1000;

/**
 * Creates a retry policy config object.
 * @param {object} options
 * @param {number} options.maxRetries - Max number of retry attempts
 * @param {number} options.backoffMs - Base backoff delay in milliseconds
 * @param {boolean} options.exponential - Whether to use exponential backoff
 * @returns {object}
 */
function createRetryPolicy({ maxRetries = DEFAULT_MAX_RETRIES, backoffMs = DEFAULT_BACKOFF_MS, exponential = true } = {}) {
  return { maxRetries, backoffMs, exponential };
}

/**
 * Calculates the delay before the next retry attempt.
 * @param {object} policy
 * @param {number} attempt - Current attempt number (1-based)
 * @returns {number} Delay in milliseconds
 */
function getRetryDelay(policy, attempt) {
  if (policy.exponential) {
    return policy.backoffMs * Math.pow(2, attempt - 1);
  }
  return policy.backoffMs;
}

/**
 * Executes a job function with retry logic based on the provided policy.
 * @param {Function} jobFn - The async job function to run
 * @param {object} policy - Retry policy from createRetryPolicy
 * @param {Function} [onRetry] - Optional callback called before each retry with (attempt, error)
 * @returns {Promise<any>} Resolves with job result or rejects after all retries exhausted
 */
async function executeWithRetry(jobFn, policy, onRetry) {
  let lastError;

  for (let attempt = 1; attempt <= policy.maxRetries + 1; attempt++) {
    try {
      return await jobFn();
    } catch (err) {
      lastError = err;

      if (attempt <= policy.maxRetries) {
        const delay = getRetryDelay(policy, attempt);
        if (typeof onRetry === 'function') {
          onRetry(attempt, err, delay);
        }
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

module.exports = { createRetryPolicy, getRetryDelay, executeWithRetry };
