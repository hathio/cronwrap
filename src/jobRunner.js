const { createRunRecord, updateRunRecord } = require('./runHistory');
const { buildAlertMessage } = require('./alerts/alertManager');
const { createRetryPolicy, executeWithRetry } = require('./retryPolicy');

/**
 * Runs a named job function, tracks history, handles retries, and fires alerts on failure.
 *
 * @param {string} name - Job identifier
 * @param {Function} jobFn - Async function containing the job logic
 * @param {object} options
 * @param {object} [options.alertConfig] - Alert configuration passed to buildAlertMessage
 * @param {object} [options.retryPolicy] - Retry policy from createRetryPolicy; defaults to no retries
 * @param {Function} [options.alertFn] - Function to send an alert message (async)
 * @param {Function} [options.logger] - Logger object with .info / .error methods
 * @returns {Promise<object>} The final run record
 */
async function runJob(name, jobFn, options = {}) {
  const {
    alertConfig = {},
    retryPolicy = createRetryPolicy({ maxRetries: 0 }),
    alertFn = null,
    logger = console,
  } = options;

  const record = createRunRecord(name);
  logger.info(`[cronwrap] Starting job: ${name} (run ${record.runId})`);

  const onRetry = (attempt, err, delay) => {
    logger.info(`[cronwrap] Job "${name}" failed on attempt ${attempt}, retrying in ${delay}ms — ${err.message}`);
  };

  try {
    const result = await executeWithRetry(jobFn, retryPolicy, onRetry);
    const finalRecord = updateRunRecord(record, { status: 'success', result });
    logger.info(`[cronwrap] Job "${name}" completed successfully in ${finalRecord.durationMs}ms`);
    return finalRecord;
  } catch (err) {
    const finalRecord = updateRunRecord(record, { status: 'failure', error: err.message });
    logger.error(`[cronwrap] Job "${name}" failed after all retries: ${err.message}`);

    if (alertFn) {
      try {
        const message = buildAlertMessage(name, finalRecord, alertConfig);
        await alertFn(message);
      } catch (alertErr) {
        logger.error(`[cronwrap] Alert delivery failed for job "${name}": ${alertErr.message}`);
      }
    }

    return finalRecord;
  }
}

module.exports = { runJob };
