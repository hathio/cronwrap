/**
 * Job health check module
 * Tracks job health status based on recent run history and failure rates
 */

const healthStore = new Map();

const DEFAULT_OPTIONS = {
  failureThreshold: 3,    // consecutive failures before unhealthy
  windowMs: 60 * 60 * 1000, // 1 hour window for rate-based checks
  failureRateThreshold: 0.5, // 50% failure rate = unhealthy
};

function getOrCreateHealth(jobId, options = {}) {
  if (!healthStore.has(jobId)) {
    healthStore.set(jobId, {
      jobId,
      options: { ...DEFAULT_OPTIONS, ...options },
      consecutiveFailures: 0,
      recentRuns: [],
      status: 'healthy',
      lastChecked: null,
    });
  }
  return healthStore.get(jobId);
}

function recordSuccess(jobId) {
  const health = getOrCreateHealth(jobId);
  health.consecutiveFailures = 0;
  health.recentRuns.push({ success: true, timestamp: Date.now() });
  pruneOldRuns(health);
  health.status = computeStatus(health);
  health.lastChecked = Date.now();
}

function recordFailure(jobId) {
  const health = getOrCreateHealth(jobId);
  health.consecutiveFailures += 1;
  health.recentRuns.push({ success: false, timestamp: Date.now() });
  pruneOldRuns(health);
  health.status = computeStatus(health);
  health.lastChecked = Date.now();
}

function pruneOldRuns(health) {
  const cutoff = Date.now() - health.options.windowMs;
  health.recentRuns = health.recentRuns.filter(r => r.timestamp >= cutoff);
}

function computeStatus(health) {
  const { failureThreshold, failureRateThreshold } = health.options;

  if (health.consecutiveFailures >= failureThreshold) {
    return 'unhealthy';
  }

  if (health.recentRuns.length >= 5) {
    const failures = health.recentRuns.filter(r => !r.success).length;
    const rate = failures / health.recentRuns.length;
    if (rate >= failureRateThreshold) return 'degraded';
  }

  return 'healthy';
}

function getHealth(jobId) {
  return healthStore.get(jobId) || null;
}

function resetHealth(jobId) {
  healthStore.delete(jobId);
}

function clearAllHealth() {
  healthStore.clear();
}

function getAllHealth() {
  return Array.from(healthStore.values()).map(h => ({
    jobId: h.jobId,
    status: h.status,
    consecutiveFailures: h.consecutiveFailures,
    totalRecentRuns: h.recentRuns.length,
    lastChecked: h.lastChecked,
  }));
}

module.exports = {
  recordSuccess,
  recordFailure,
  getHealth,
  resetHealth,
  clearAllHealth,
  getAllHealth,
};
