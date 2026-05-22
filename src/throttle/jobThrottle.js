/**
 * Job throttle — limits how often a job can run within a time window.
 */

const throttleStore = new Map();

/**
 * @param {string} jobName
 * @param {number} windowMs - time window in milliseconds
 * @returns {{ jobName, windowMs, timestamps: [] }}
 */
function createThrottle(jobName, windowMs) {
  if (!jobName || typeof jobName !== 'string') {
    throw new Error('jobName must be a non-empty string');
  }
  if (!windowMs || windowMs <= 0) {
    throw new Error('windowMs must be a positive number');
  }

  const throttle = { jobName, windowMs, timestamps: [] };
  throttleStore.set(jobName, throttle);
  return throttle;
}

function getThrottle(jobName) {
  return throttleStore.get(jobName) || null;
}

/**
 * Returns true if the job is allowed to run (not throttled).
 * Prunes old timestamps outside the window before checking.
 */
function checkThrottle(jobName, maxRuns = 1) {
  const throttle = throttleStore.get(jobName);
  if (!throttle) return true;

  const now = Date.now();
  throttle.timestamps = throttle.timestamps.filter(
    (ts) => now - ts < throttle.windowMs
  );

  if (throttle.timestamps.length >= maxRuns) {
    return false;
  }

  throttle.timestamps.push(now);
  return true;
}

function removeThrottle(jobName) {
  return throttleStore.delete(jobName);
}

function clearAllThrottles() {
  throttleStore.clear();
}

module.exports = {
  createThrottle,
  getThrottle,
  checkThrottle,
  removeThrottle,
  clearAllThrottles,
};
