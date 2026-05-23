const {
  setTags,
  addTags,
  removeTags,
  getTags,
  getJobsByTag,
  hasTag,
  clearTags,
  clearAllTags,
} = require('./jobTags');

const { createTagMiddleware } = require('./tagMiddleware');

module.exports = {
  setTags,
  addTags,
  removeTags,
  getTags,
  getJobsByTag,
  hasTag,
  clearTags,
  clearAllTags,
  createTagMiddleware,
};
