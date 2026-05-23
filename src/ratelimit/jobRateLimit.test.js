const {
  createRateLimit,
  getRateLimit,
  checkRateLimit,
  recordRun,
  removeRateLimit,
  clearAllRateLimits,
} = require('./jobRateLimit');

const { createRateLimitMiddleware } = require('./rateLimitMiddleware');

beforeEach(() => {
  clearAllRateLimits();
});

describe('createRateLimit', () => {
  it('creates and stores a rate limit config', () => {
    const limit = createRateLimit('job-a', 5, 60000);
    expect(limit.jobId).toBe('job-a');
    expect(limit.maxRuns).toBe(5);
    expect(limit.windowMs).toBe(60000);
    expect(limit.runs).toEqual([]);
  });
});

describe('getRateLimit', () => {
  it('returns null for unknown job', () => {
    expect(getRateLimit('nope')).toBeNull();
  });

  it('returns the limit for a known job', () => {
    createRateLimit('job-b', 3, 1000);
    expect(getRateLimit('job-b')).not.toBeNull();
  });
});

describe('checkRateLimit', () => {
  it('allows runs when no limit is set', () => {
    const result = checkRateLimit('unknown-job');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(Infinity);
  });

  it('allows runs within the limit', () => {
    createRateLimit('job-c', 3, 60000);
    recordRun('job-c');
    const result = checkRateLimit('job-c');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it('blocks runs when limit is exceeded', () => {
    createRateLimit('job-d', 2, 60000);
    recordRun('job-d');
    recordRun('job-d');
    const result = checkRateLimit('job-d');
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.resetAt).toBeGreaterThan(Date.now());
  });

  it('prunes stale runs outside the window', async () => {
    createRateLimit('job-e', 2, 50);
    recordRun('job-e');
    recordRun('job-e');
    await new Promise(r => setTimeout(r, 60));
    const result = checkRateLimit('job-e');
    expect(result.allowed).toBe(true);
  });
});

describe('removeRateLimit', () => {
  it('removes a rate limit', () => {
    createRateLimit('job-f', 1, 1000);
    removeRateLimit('job-f');
    expect(getRateLimit('job-f')).toBeNull();
  });
});

describe('createRateLimitMiddleware', () => {
  it('calls next when under the limit', async () => {
    createRateLimit('mw-job', 3, 60000);
    const middleware = createRateLimitMiddleware('mw-job');
    const next = jest.fn();
    const ctx = {};
    await middleware(ctx, next);
    expect(next).toHaveBeenCalled();
    expect(ctx.rateLimit.remaining).toBe(2);
  });

  it('throws when rate limit is exceeded', async () => {
    createRateLimit('mw-job2', 1, 60000);
    recordRun('mw-job2');
    const middleware = createRateLimitMiddleware('mw-job2');
    const next = jest.fn();
    await expect(middleware({}, next)).rejects.toThrow('Rate limit exceeded');
    expect(next).not.toHaveBeenCalled();
  });

  it('sets error code on rate limit error', async () => {
    createRateLimit('mw-job3', 1, 60000);
    recordRun('mw-job3');
    const middleware = createRateLimitMiddleware('mw-job3');
    try {
      await middleware({}, jest.fn());
    } catch (err) {
      expect(err.code).toBe('RATE_LIMIT_EXCEEDED');
    }
  });
});
