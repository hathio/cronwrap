/**
 * Middleware that blocks job execution if dependencies haven't completed
 */

const { areDependenciesMet, getUnmetDependencies, markCompleted, markFailed } = require('./jobDependencies');

function createDependencyMiddleware() {
  return async function dependencyMiddleware(ctx, next) {
    const { jobName } = ctx;

    if (!areDependenciesMet(jobName)) {
      const unmet = getUnmetDependencies(jobName);
      const err = new Error(
        `Job "${jobName}" blocked — unmet dependencies: ${unmet.join(', ')}`
      );
      err.code = 'DEPENDENCY_UNMET';
      err.unmetDependencies = unmet;
      throw err;
    }

    try {
      await next();
      markCompleted(jobName);
    } catch (err) {
      markFailed(jobName);
      throw err;
    }
  };
}

module.exports = { createDependencyMiddleware };
