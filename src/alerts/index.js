/**
 * Alerts module entry point.
 * Re-exports alertOnFailure for use in jobRunner.
 */
const { alertOnFailure } = require('./alertManager');

module.exports = { alertOnFailure };
