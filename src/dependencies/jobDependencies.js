/**
 * Job dependency tracking — ensure jobs run only after their dependencies complete
 */

const dependencies = new Map();
const completedJobs = new Set();

function setDependencies(jobName, deps = []) {
  if (!Array.isArray(deps)) {
    throw new Error('Dependencies must be an array');
  }
  dependencies.set(jobName, [...deps]);
}

function getDependencies(jobName) {
  return dependencies.get(jobName) || [];
}

function markCompleted(jobName) {
  completedJobs.add(jobName);
}

function markFailed(jobName) {
  completedJobs.delete(jobName);
}

function areDependenciesMet(jobName) {
  const deps = getDependencies(jobName);
  return deps.every((dep) => completedJobs.has(dep));
}

function getUnmetDependencies(jobName) {
  const deps = getDependencies(jobName);
  return deps.filter((dep) => !completedJobs.has(dep));
}

function removeDependencies(jobName) {
  dependencies.delete(jobName);
}

function clearAll() {
  dependencies.clear();
  completedJobs.clear();
}

function getCompletedJobs() {
  return [...completedJobs];
}

module.exports = {
  setDependencies,
  getDependencies,
  markCompleted,
  markFailed,
  areDependenciesMet,
  getUnmetDependencies,
  removeDependencies,
  clearAll,
  getCompletedJobs,
};
