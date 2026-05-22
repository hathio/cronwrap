/**
 * jobMetrics.js
 * Tracks execution metrics for cron jobs: run counts, durations, success/failure rates.
 */

const metrics = new Map();

function getOrCreateMetric(jobName) {
  if (!metrics.has(jobName)) {
    metrics.set(jobName, {
      jobName,
      totalRuns: 0,
      successCount: 0,
      failureCount: 0,
      totalDurationMs: 0,
      minDurationMs: null,
      maxDurationMs: null,
      lastRunAt: null,
      lastStatus: null,
    });
  }
  return metrics.get(jobName);
}

function recordRun(jobName, { durationMs, success }) {
  const metric = getOrCreateMetric(jobName);

  metric.totalRuns += 1;
  metric.totalDurationMs += durationMs;
  metric.lastRunAt = new Date().toISOString();
  metric.lastStatus = success ? 'success' : 'failure';

  if (success) {
    metric.successCount += 1;
  } else {
    metric.failureCount += 1;
  }

  if (metric.minDurationMs === null || durationMs < metric.minDurationMs) {
    metric.minDurationMs = durationMs;
  }
  if (metric.maxDurationMs === null || durationMs > metric.maxDurationMs) {
    metric.maxDurationMs = durationMs;
  }

  return metric;
}

function getMetrics(jobName) {
  if (jobName) {
    return metrics.get(jobName) || null;
  }
  return Object.fromEntries(metrics);
}

function getAverageDuration(jobName) {
  const metric = metrics.get(jobName);
  if (!metric || metric.totalRuns === 0) return 0;
  return Math.round(metric.totalDurationMs / metric.totalRuns);
}

function resetMetrics(jobName) {
  if (jobName) {
    metrics.delete(jobName);
  } else {
    metrics.clear();
  }
}

module.exports = { recordRun, getMetrics, getAverageDuration, resetMetrics };
