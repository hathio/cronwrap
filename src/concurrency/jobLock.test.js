const {
  acquireLock,
  releaseLock,
  isLocked,
  getLockInfo,
  clearAllLocks,
} = require('./jobLock');
const { createConcurrencyMiddleware } = require('./concurrencyMiddleware');

beforeEach(() => {
  clearAllLocks();
});

describe('acquireLock', () => {
  it('acquires a lock for a new job', () => {
    expect(acquireLock('jobA')).toBe(true);
    expect(isLocked('jobA')).toBe(true);
  });

  it('returns false if job is already locked', () => {
    acquireLock('jobA');
    expect(acquireLock('jobA')).toBe(false);
  });

  it('allows different jobs to lock independently', () => {
    expect(acquireLock('jobA')).toBe(true);
    expect(acquireLock('jobB')).toBe(true);
  });
});

describe('releaseLock', () => {
  it('releases an existing lock', () => {
    acquireLock('jobA');
    releaseLock('jobA');
    expect(isLocked('jobA')).toBe(false);
  });

  it('does nothing if lock does not exist', () => {
    expect(() => releaseLock('nonexistent')).not.toThrow();
  });
});

describe('getLockInfo', () => {
  it('returns lock metadata when locked', () => {
    acquireLock('jobA');
    const info = getLockInfo('jobA');
    expect(info).not.toBeNull();
    expect(info).toHaveProperty('acquiredAt');
    expect(info).toHaveProperty('pid', process.pid);
  });

  it('returns null when not locked', () => {
    expect(getLockInfo('jobA')).toBeNull();
  });
});

describe('createConcurrencyMiddleware', () => {
  it('calls next when no lock is held', async () => {
    const middleware = createConcurrencyMiddleware('jobA');
    const next = jest.fn().mockResolvedValue(undefined);
    const ctx = {};
    await middleware(ctx, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(ctx.skipped).toBeUndefined();
  });

  it('skips execution and calls onSkip when already locked', async () => {
    acquireLock('jobA');
    const onSkip = jest.fn();
    const middleware = createConcurrencyMiddleware('jobA', { onSkip });
    const next = jest.fn();
    const ctx = {};
    await middleware(ctx, next);
    expect(next).not.toHaveBeenCalled();
    expect(ctx.skipped).toBe(true);
    expect(ctx.skipReason).toBe('locked');
    expect(onSkip).toHaveBeenCalledWith('jobA');
  });

  it('releases lock after next completes', async () => {
    const middleware = createConcurrencyMiddleware('jobA');
    const next = jest.fn().mockResolvedValue(undefined);
    await middleware({}, next);
    expect(isLocked('jobA')).toBe(false);
  });

  it('releases lock even if next throws', async () => {
    const middleware = createConcurrencyMiddleware('jobA');
    const next = jest.fn().mockRejectedValue(new Error('boom'));
    await expect(middleware({}, next)).rejects.toThrow('boom');
    expect(isLocked('jobA')).toBe(false);
  });
});
