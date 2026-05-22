const { createThrottle, clearAllThrottles } = require('./jobThrottle');
const { createThrottleMiddleware } = require('./throttleMiddleware');

beforeEach(() => {
  clearAllThrottles();
});

function makeContext(jobName) {
  return { jobName };
}

describe('createThrottleMiddleware', () => {
  it('calls next when no throttle is configured', async () => {
    const middleware = createThrottleMiddleware();
    const next = jest.fn();
    const ctx = makeContext('unknownJob');

    await middleware(ctx, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(ctx.throttled).toBeUndefined();
  });

  it('calls next when job is within throttle limit', async () => {
    createThrottle('jobA', 5000);
    const middleware = createThrottleMiddleware({ maxRuns: 2 });
    const next = jest.fn();
    const ctx = makeContext('jobA');

    await middleware(ctx, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(ctx.throttled).toBeUndefined();
  });

  it('blocks and sets throttled flag when limit exceeded', async () => {
    createThrottle('jobB', 5000);
    const middleware = createThrottleMiddleware({ maxRuns: 1 });
    const next = jest.fn();

    // First run — allowed (records timestamp)
    await middleware(makeContext('jobB'), next);
    expect(next).toHaveBeenCalledTimes(1);

    // Second run — blocked
    const ctx2 = makeContext('jobB');
    await middleware(ctx2, next);
    expect(next).toHaveBeenCalledTimes(1); // still 1
    expect(ctx2.throttled).toBe(true);
    expect(ctx2.throttleMessage).toMatch(/throttled/);
  });

  it('uses maxRuns=1 as default', async () => {
    createThrottle('jobC', 5000);
    const middleware = createThrottleMiddleware();
    const next = jest.fn();

    await middleware(makeContext('jobC'), next);
    const ctx2 = makeContext('jobC');
    await middleware(ctx2, next);

    expect(ctx2.throttled).toBe(true);
  });
});
