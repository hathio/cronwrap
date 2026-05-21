const { createRunRecord, updateRunRecord } = require('./runHistory');

/**
 * Wraps a cron job function with logging, error handling, and run history tracking.
 * @param {string} jobName - Unique name for the cron job
 * @param {Function} fn - The async function to execute
 * @param {object} options - Optional configuration
 * @param {Function} options.onError - Callback invoked with (error, record) on failure
 * @param {Function} options.onSuccess - Callback invoked with (record) on success
 */
async function runJob(jobName, fn, options = {}) {
  const { onError, onSuccess } = options;
  const record = createRunRecord(jobName);

  console.log(`[cronwrap] [${jobName}] Starting job at ${record.startedAt}`);

  try {
    await fn();

    const completed = updateRunRecord(record, { status: 'success' });
    console.log(
      `[cronwrap] [${jobName}] Completed successfully in ${completed.durationMs}ms`
    );

    if (typeof onSuccess === 'function') {
      await onSuccess(completed);
    }

    return completed;
  } catch (err) {
    const failed = updateRunRecord(record, {
      status: 'failure',
      error: err.message,
    });

    console.error(
      `[cronwrap] [${jobName}] Failed after ${failed.durationMs}ms: ${err.message}`
    );

    if (typeof onError === 'function') {
      await onError(err, failed);
    }

    return failed;
  }
}

module.exports = { runJob };
