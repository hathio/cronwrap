// Job priority queue — higher priority jobs run first

const priorities = new Map();
const VALID_LEVELS = ['low', 'normal', 'high', 'critical'];
const LEVEL_VALUES = { low: 0, normal: 1, high: 2, critical: 3 };

function setPriority(jobId, level = 'normal') {
  if (!VALID_LEVELS.includes(level)) {
    throw new Error(`Invalid priority level: ${level}. Must be one of: ${VALID_LEVELS.join(', ')}`);
  }
  priorities.set(jobId, { level, value: LEVEL_VALUES[level], setAt: Date.now() });
}

function getPriority(jobId) {
  return priorities.get(jobId) || { level: 'normal', value: LEVEL_VALUES.normal, setAt: null };
}

function removePriority(jobId) {
  return priorities.delete(jobId);
}

function comparePriority(jobIdA, jobIdB) {
  const a = getPriority(jobIdA);
  const b = getPriority(jobIdB);
  // Higher value = higher priority; if equal, earlier setAt wins
  if (b.value !== a.value) return b.value - a.value;
  if (a.setAt && b.setAt) return a.setAt - b.setAt;
  return 0;
}

function sortJobsByPriority(jobIds) {
  return [...jobIds].sort(comparePriority);
}

function getJobsByPriority(level) {
  if (!VALID_LEVELS.includes(level)) {
    throw new Error(`Invalid priority level: ${level}`);
  }
  return Array.from(priorities.entries())
    .filter(([, info]) => info.level === level)
    .map(([jobId]) => jobId);
}

function clearAllPriorities() {
  priorities.clear();
}

module.exports = {
  VALID_LEVELS,
  setPriority,
  getPriority,
  removePriority,
  comparePriority,
  sortJobsByPriority,
  getJobsByPriority,
  clearAllPriorities,
};
