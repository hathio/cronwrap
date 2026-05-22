const { randomUUID } = require('crypto');

/**
 * Creates a new run record for a job at start time.
 * @param {string} jobName
 * @returns {object}
 */
function createRunRecord(jobName) {
  return {
    id: randomUUID(),
    jobName,
    status: 'running',
    startTime: new Date(),
    endTime: null,
    durationMs: null,
    error: null,
  };
}

/**
 * Returns an updated copy of a run record with end time and duration.
 * @param {object} record - original run record
 * @param {object} updates - fields to merge (status, error, etc.)
 * @returns {object}
 */
function updateRunRecord(record, updates = {}) {
  const endTime = new Date();
  return {
    ...record,
    ...updates,
    endTime,
    durationMs: endTime - record.startTime,
  };
}

/**
 * Formats a run record into a human-readable log string.
 * @param {object} record
 * @returns {string}
 */
function formatRecord(record) {
  const start = record.startTime.toISOString();
  const duration = record.durationMs !== null ? `${record.durationMs}ms` : 'n/a';
  let line = `[${start}] job="${record.jobName}" id=${record.id} status=${record.status} duration=${duration}`;

  if (record.error) {
    const msg = record.error instanceof Error ? record.error.message : String(record.error);
    line += ` error="${msg}"`;
  }

  return line;
}

module.exports = { createRunRecord, updateRunRecord, formatRecord };
