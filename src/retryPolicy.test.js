const { createRetryPolicy, getRetryDelay, executeWithRetry } = require('./retryPolicy');

describe('createRetryPolicy', () => {
  it('returns defaults when no options given', () => {
    const policy = createRetryPolicy();
    expect(policy.maxRetries).toBe(3);
    expect(policy.backoffMs).toBe(1000);
    expect(policy.exponential).toBe(true);
  });

  it('respects custom options', () => {
    const policy = createRetryPolicy({ maxRetries: 5, backoffMs: 500, exponential: false });
    expect(policy.maxRetries).toBe(5);
    expect(policy.backoffMs).toBe(500);
    expect(policy.exponential).toBe(false);
  });
});

describe('getRetryDelay', () => {
  it('returns fixed delay when exponential is false', () => {
    const policy = createRetryPolicy({ backoffMs: 200, exponential: false });
    expect(getRetryDelay(policy, 1)).toBe(200);
    expect(getRetryDelay(policy, 3)).toBe(200);
  });

  it('returns exponential delay when exponential is true', () => {
    const policy = createRetryPolicy({ backoffMs: 100, exponential: true });
    expect(getRetryDelay(policy, 1)).toBe(100);
    expect(getRetryDelay(policy, 2)).toBe(200);
    expect(getRetryDelay(policy, 3)).toBe(400);
  });
});

describe('executeWithRetry', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('resolves immediately if job succeeds on first try', async () => {
    const job = jest.fn().mockResolvedValue('ok');
    const policy = createRetryPolicy({ maxRetries: 2, backoffMs: 10 });
    const result = await executeWithRetry(job, policy);
    expect(result).toBe('ok');
    expect(job).toHaveBeenCalledTimes(1);
  });

  it('retries on failure and resolves when job eventually succeeds', async () => {
    const job = jest.fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValue('success');

    const policy = createRetryPolicy({ maxRetries: 3, backoffMs: 10, exponential: false });
    const promise = executeWithRetry(job, policy);
    await jest.runAllTimersAsync();
    const result = await promise;
    expect(result).toBe('success');
    expect(job).toHaveBeenCalledTimes(3);
  });

  it('throws after all retries are exhausted', async () => {
    const job = jest.fn().mockRejectedValue(new Error('always fails'));
    const policy = createRetryPolicy({ maxRetries: 2, backoffMs: 10, exponential: false });
    const promise = executeWithRetry(job, policy);
    await jest.runAllTimersAsync();
    await expect(promise).rejects.toThrow('always fails');
    expect(job).toHaveBeenCalledTimes(3);
  });

  it('calls onRetry callback with attempt info', async () => {
    const job = jest.fn()
      .mockRejectedValueOnce(new Error('err'))
      .mockResolvedValue('done');

    const policy = createRetryPolicy({ maxRetries: 2, backoffMs: 50, exponential: false });
    const onRetry = jest.fn();
    const promise = executeWithRetry(job, policy, onRetry);
    await jest.runAllTimersAsync();
    await promise;
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error), 50);
  });
});
