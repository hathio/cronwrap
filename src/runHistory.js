/**
 * Creates a new run record with a start timestamp.
 * @param {string} jobName
 * @returns {object} run record
 */
function createRunRecord(jobName) {
  return {
    jobName,
    startedAt: new Date().toISOString(),
    _startMs: Date.now(),
    status: 'running',
    finishedAt: null,
    durationMs: null,
    error: null,
  };
}

/**
 * Finalizes a run record with status, duration, and optional error.
 * @param {object} record - The record created by createRunRecord
 * @param {object} updates - Fields to merge (status, error)
 * @returns {object} completed record
 */
function updateRunRecord(record, updates = {}) {
  const finishedAt = new Date().toISOString();
  const durationMs = Date.now() - record._startMs;

  const completed = {
    ...record,
    ...updates,
    finishedAt,
    durationMs,
  };

  // Remove internal timing field before returning
  delete completed._startMs;

  return completed;
}

/**
 * Formats a run record as a human-readable summary string.
 * @param {object} record
 * @returns {string}
 */
function formatRecord(record) {
  const status = record.status.toUpperCase();
  const duration = record.durationMs != null ? `${record.durationMs}ms` : 'N/A';
  const errorInfo = record.error ? ` | Error: ${record.error}` : '';
  return `[${record.jobName}] ${status} | Started: ${record.startedAt} | Duration: ${duration}${errorInfo}`;
}

module.exports = { createRunRecord, updateRunRecord, formatRecord };
