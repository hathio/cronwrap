const { withTimeout, createTimeoutMiddleware, TimeoutError } = require('./jobTimeout');

describe('withTimeout', () => {
  it('resolves if job finishes before timeout', async () => {
    const job = async () => 'done';
    const wrapped = withTimeout(job, 500, 'fastJob');
    await expect(wrapped()).resolves.toBe('done');
  });

  it('rejects with TimeoutError if job exceeds timeout', async () => {
    const job = () => new Promise(resolve => setTimeout(resolve, 300));
    const wrapped = withTimeout(job, 50, 'slowJob');
    await expect(wrapped()).rejects.toThrow(TimeoutError);
  });

  it('TimeoutError has correct jobName and timeoutMs', async () => {
    const job = () => new Promise(resolve => setTimeout(resolve, 300));
    const wrapped = withTimeout(job, 50, 'myJob');
    try {
      await wrapped();
    } catch (err) {
      expect(err.jobName).toBe('myJob');
      expect(err.timeoutMs).toBe(50);
      expect(err.name).toBe('TimeoutError');
    }
  });

  it('passes arguments to the wrapped function', async () => {
    const job = async (a, b) => a + b;
    const wrapped = withTimeout(job, 500, 'addJob');
    await expect(wrapped(2, 3)).resolves.toBe(5);
  });

  it('throws if fn is not a function', () => {
    expect(() => withTimeout('notafn', 100)).toThrow(TypeError);
  });

  it('throws if ms is not a positive number', () => {
    expect(() => withTimeout(async () => {}, -1)).toThrow(RangeError);
    expect(() => withTimeout(async () => {}, 0)).toThrow(RangeError);
  });
});

describe('createTimeoutMiddleware', () => {
  it('calls next and resolves within timeout', async () => {
    const middleware = createTimeoutMiddleware(500);
    const next = jest.fn().mockResolvedValue(undefined);
    const ctx = { jobName: 'testJob' };
    await expect(middleware(ctx, next)).resolves.toBeUndefined();
    expect(next).toHaveBeenCalled();
  });

  it('rejects if next exceeds timeout', async () => {
    const middleware = createTimeoutMiddleware(50);
    const next = () => new Promise(resolve => setTimeout(resolve, 300));
    const ctx = { jobName: 'slowJob' };
    await expect(middleware(ctx, next)).rejects.toThrow(TimeoutError);
  });

  it('throws RangeError for invalid ms', () => {
    expect(() => createTimeoutMiddleware(0)).toThrow(RangeError);
    expect(() => createTimeoutMiddleware(-100)).toThrow(RangeError);
  });

  it('uses unknown as jobName when ctx.jobName is missing', async () => {
    const middleware = createTimeoutMiddleware(50);
    const next = () => new Promise(resolve => setTimeout(resolve, 300));
    try {
      await middleware({}, next);
    } catch (err) {
      expect(err.jobName).toBe('unknown');
    }
  });
});
