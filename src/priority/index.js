const {
  VALID_LEVELS,
  setPriority,
  getPriority,
  removePriority,
  comparePriority,
  sortJobsByPriority,
  getJobsByPriority,
  clearAllPriorities,
} = require('./jobPriority');

const { createPriorityMiddleware } = require('./priorityMiddleware');

module.exports = {
  VALID_LEVELS,
  setPriority,
  getPriority,
  removePriority,
  comparePriority,
  sortJobsByPriority,
  getJobsByPriority,
  clearAllPriorities,
  createPriorityMiddleware,
};
