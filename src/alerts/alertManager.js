const { sendSlackAlert } = require('./slackAlert');
const { sendEmailAlert } = require('./emailAlert');

const ALERT_CHANNELS = {
  slack: sendSlackAlert,
  email: sendEmailAlert,
};

/**
 * Send alerts for a failed or long-running job.
 * @param {object} record - The run record from runHistory
 * @param {object} config - Alert configuration
 * @param {string[]} config.channels - e.g. ['slack', 'email']
 * @param {number} [config.maxDurationMs] - Threshold to alert on slow jobs
 */
async function alertOnFailure(record, config = {}) {
  if (!config.channels || config.channels.length === 0) return;

  const isFailed = record.status === 'failed';
  const isSlow =
    config.maxDurationMs != null &&
    record.durationMs != null &&
    record.durationMs > config.maxDurationMs;

  if (!isFailed && !isSlow) return;

  const reason = isFailed ? 'Job failed' : 'Job exceeded duration threshold';
  const message = buildAlertMessage(record, reason);

  const sends = config.channels.map((channel) => {
    const fn = ALERT_CHANNELS[channel];
    if (!fn) {
      console.warn(`[alertManager] Unknown alert channel: ${channel}`);
      return Promise.resolve();
    }
    return fn(message, config).catch((err) => {
      console.error(`[alertManager] Failed to send ${channel} alert:`, err.message);
    });
  });

  await Promise.all(sends);
}

function buildAlertMessage(record, reason) {
  return {
    subject: `[cronwrap] ${reason}: ${record.jobName}`,
    body: [
      `Job: ${record.jobName}`,
      `Status: ${record.status}`,
      `Started: ${record.startedAt}`,
      `Duration: ${record.durationMs != null ? record.durationMs + 'ms' : 'N/A'}`,
      record.error ? `Error: ${record.error}` : null,
    ]
      .filter(Boolean)
      .join('\n'),
  };
}

module.exports = { alertOnFailure, buildAlertMessage };
