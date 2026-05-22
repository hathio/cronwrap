/**
 * metrics/index.js
 * Public API for the metrics module.
 */

const { recordRun, getMetrics, getAverageDuration, resetMetrics } = require('./jobMetrics');

module.exports = {
  recordRun,
  getMetrics,
  getAverageDuration,
  resetMetrics,
};
