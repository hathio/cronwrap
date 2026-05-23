/**
 * Job tagging system — attach metadata tags to jobs for filtering and grouping
 */

const tagRegistry = new Map();

/**
 * Set tags for a job, replacing any existing tags
 * @param {string} jobName
 * @param {string[]} tags
 */
function setTags(jobName, tags) {
  if (!jobName) throw new Error('jobName is required');
  if (!Array.isArray(tags)) throw new Error('tags must be an array');
  tagRegistry.set(jobName, [...new Set(tags)]);
}

/**
 * Add one or more tags to a job without removing existing ones
 * @param {string} jobName
 * @param {string[]} tags
 */
function addTags(jobName, tags) {
  if (!jobName) throw new Error('jobName is required');
  if (!Array.isArray(tags)) throw new Error('tags must be an array');
  const existing = tagRegistry.get(jobName) || [];
  tagRegistry.set(jobName, [...new Set([...existing, ...tags])]);
}

/**
 * Remove specific tags from a job
 * @param {string} jobName
 * @param {string[]} tags
 */
function removeTags(jobName, tags) {
  const existing = tagRegistry.get(jobName) || [];
  tagRegistry.set(jobName, existing.filter(t => !tags.includes(t)));
}

/**
 * Get all tags for a job
 * @param {string} jobName
 * @returns {string[]}
 */
function getTags(jobName) {
  return tagRegistry.get(jobName) || [];
}

/**
 * Find all job names that have a given tag
 * @param {string} tag
 * @returns {string[]}
 */
function getJobsByTag(tag) {
  const result = [];
  for (const [jobName, tags] of tagRegistry.entries()) {
    if (tags.includes(tag)) result.push(jobName);
  }
  return result;
}

/**
 * Check if a job has a specific tag
 * @param {string} jobName
 * @param {string} tag
 * @returns {boolean}
 */
function hasTag(jobName, tag) {
  return getTags(jobName).includes(tag);
}

/**
 * Clear all tags for a job
 * @param {string} jobName
 */
function clearTags(jobName) {
  tagRegistry.delete(jobName);
}

/**
 * Clear the entire tag registry (useful for testing)
 */
function clearAllTags() {
  tagRegistry.clear();
}

module.exports = {
  setTags,
  addTags,
  removeTags,
  getTags,
  getJobsByTag,
  hasTag,
  clearTags,
  clearAllTags,
};
