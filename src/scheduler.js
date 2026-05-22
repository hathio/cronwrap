const cron = require('node-cron');
const { runJob } = require('./jobRunner');

const scheduledJobs = new Map();

/**
 * Schedule a cron job with logging and alerting support.
 * @param {string} name - Unique name for the job
 * @param {string} cronExpression - Cron expression (e.g. '0 * * * *')
 * @param {Function} task - Async function to execute
 * @param {Object} options - Options passed to jobRunner
 * @returns {Object} The scheduled task handle
 */
function scheduleJob(name, cronExpression, task, options = {}) {
  if (scheduledJobs.has(name)) {
    throw new Error(`A job with the name "${name}" is already scheduled.`);
  }

  if (!cron.validate(cronExpression)) {
    throw new Error(`Invalid cron expression: "${cronExpression}"`);
  }

  const scheduledTask = cron.schedule(cronExpression, async () => {
    await runJob(name, task, options);
  }, {
    scheduled: true,
    timezone: options.timezone || 'UTC',
  });

  scheduledJobs.set(name, {
    task: scheduledTask,
    cronExpression,
    options,
    createdAt: new Date().toISOString(),
  });

  return scheduledTask;
}

/**
 * Stop and remove a scheduled job by name.
 * @param {string} name
 * @returns {boolean} true if removed, false if not found
 */
function removeJob(name) {
  const entry = scheduledJobs.get(name);
  if (!entry) return false;

  entry.task.stop();
  scheduledJobs.delete(name);
  return true;
}

/**
 * List all currently scheduled jobs.
 * @returns {Array}
 */
function listJobs() {
  return Array.from(scheduledJobs.entries()).map(([name, entry]) => ({
    name,
    cronExpression: entry.cronExpression,
    timezone: entry.options.timezone || 'UTC',
    createdAt: entry.createdAt,
  }));
}

module.exports = { scheduleJob, removeJob, listJobs };
