/**
 * Rate limiting for cron jobs — limits how many times a job can run
 * within a given time window.
 */

const rateLimits = new Map();

function createRateLimit(jobId, maxRuns, windowMs) {
  const limit = {
    jobId,
    maxRuns,
    windowMs,
    runs: [],
  };
  rateLimits.set(jobId, limit);
  return limit;
}

function getRateLimit(jobId) {
  return rateLimits.get(jobId) || null;
}

function checkRateLimit(jobId) {
  const limit = rateLimits.get(jobId);
  if (!limit) return { allowed: true, remaining: Infinity };

  const now = Date.now();
  // Prune runs outside the current window
  limit.runs = limit.runs.filter(ts => now - ts < limit.windowMs);

  const remaining = limit.maxRuns - limit.runs.length;
  if (remaining <= 0) {
    const resetAt = limit.runs[0] + limit.windowMs;
    return { allowed: false, remaining: 0, resetAt };
  }

  return { allowed: true, remaining };
}

function recordRun(jobId) {
  const limit = rateLimits.get(jobId);
  if (!limit) return;
  limit.runs.push(Date.now());
}

function removeRateLimit(jobId) {
  return rateLimits.delete(jobId);
}

function clearAllRateLimits() {
  rateLimits.clear();
}

module.exports = {
  createRateLimit,
  getRateLimit,
  checkRateLimit,
  recordRun,
  removeRateLimit,
  clearAllRateLimits,
};
