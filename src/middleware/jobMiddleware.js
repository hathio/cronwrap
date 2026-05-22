/**
 * Job middleware pipeline — lets you attach before/after hooks to any job.
 * Hooks run in order and can modify the job context.
 */

/**
 * Creates a middleware pipeline for a job.
 * @param {Function[]} middlewares - Array of async middleware functions
 * @returns {Function} - A function that runs the pipeline around a job
 */
function createMiddlewarePipeline(middlewares = []) {
  return async function runWithMiddleware(jobContext, jobFn) {
    const beforeHooks = [];
    const afterHooks = [];

    for (const mw of middlewares) {
      if (typeof mw.before === 'function') beforeHooks.push(mw.before);
      if (typeof mw.after === 'function') afterHooks.push(mw.after);
    }

    for (const hook of beforeHooks) {
      await hook(jobContext);
    }

    let result;
    let error;

    try {
      result = await jobFn(jobContext);
      jobContext.status = 'success';
      jobContext.result = result;
    } catch (err) {
      error = err;
      jobContext.status = 'failed';
      jobContext.error = err.message;
    }

    for (const hook of afterHooks) {
      await hook(jobContext);
    }

    if (error) throw error;
    return result;
  };
}

/**
 * Built-in timing middleware — records start/end time on the context.
 */
const timingMiddleware = {
  before(ctx) {
    ctx.startedAt = new Date().toISOString();
  },
  after(ctx) {
    ctx.finishedAt = new Date().toISOString();
    const ms = new Date(ctx.finishedAt) - new Date(ctx.startedAt);
    ctx.durationMs = ms;
  },
};

/**
 * Built-in logging middleware — logs job start/finish to console.
 */
const loggingMiddleware = {
  before(ctx) {
    console.log(`[cronwrap] Job "${ctx.jobName}" starting...`);
  },
  after(ctx) {
    const status = ctx.status || 'unknown';
    console.log(`[cronwrap] Job "${ctx.jobName}" finished with status: ${status} (${ctx.durationMs ?? '?'}ms)`);
  },
};

module.exports = { createMiddlewarePipeline, timingMiddleware, loggingMiddleware };
