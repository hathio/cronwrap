const {
  createMiddlewarePipeline,
  timingMiddleware,
  loggingMiddleware,
} = require('./jobMiddleware');

describe('createMiddlewarePipeline', () => {
  it('runs a job and returns its result', async () => {
    const pipeline = createMiddlewarePipeline([]);
    const ctx = { jobName: 'test' };
    const result = await pipeline(ctx, async () => 'done');
    expect(result).toBe('done');
  });

  it('runs before and after hooks in order', async () => {
    const order = [];
    const mw1 = {
      before: async () => order.push('before1'),
      after: async () => order.push('after1'),
    };
    const mw2 = {
      before: async () => order.push('before2'),
      after: async () => order.push('after2'),
    };
    const pipeline = createMiddlewarePipeline([mw1, mw2]);
    await pipeline({ jobName: 'test' }, async () => {});
    expect(order).toEqual(['before1', 'before2', 'after1', 'after2']);
  });

  it('sets status to success on the context', async () => {
    const pipeline = createMiddlewarePipeline([]);
    const ctx = { jobName: 'test' };
    await pipeline(ctx, async () => {});
    expect(ctx.status).toBe('success');
  });

  it('sets status to failed and still runs after hooks on error', async () => {
    const afterCalled = [];
    const mw = { after: async (ctx) => afterCalled.push(ctx.status) };
    const pipeline = createMiddlewarePipeline([mw]);
    const ctx = { jobName: 'failing-job' };
    await expect(pipeline(ctx, async () => { throw new Error('boom'); })).rejects.toThrow('boom');
    expect(ctx.status).toBe('failed');
    expect(ctx.error).toBe('boom');
    expect(afterCalled).toEqual(['failed']);
  });

  it('handles middleware with only a before hook', async () => {
    const called = [];
    const mw = { before: async () => called.push('before') };
    const pipeline = createMiddlewarePipeline([mw]);
    await pipeline({ jobName: 'test' }, async () => {});
    expect(called).toEqual(['before']);
  });

  it('handles middleware with only an after hook', async () => {
    const called = [];
    const mw = { after: async () => called.push('after') };
    const pipeline = createMiddlewarePipeline([mw]);
    await pipeline({ jobName: 'test' }, async () => {});
    expect(called).toEqual(['after']);
  });

  it('passes context to before and after hooks', async () => {
    const captured = [];
    const mw = {
      before: async (ctx) => captured.push({ hook: 'before', jobName: ctx.jobName }),
      after: async (ctx) => captured.push({ hook: 'after', jobName: ctx.jobName }),
    };
    const pipeline = createMiddlewarePipeline([mw]);
    await pipeline({ jobName: 'ctx-test' }, async () => {});
    expect(captured).toEqual([
      { hook: 'before', jobName: 'ctx-test' },
      { hook: 'after', jobName: 'ctx-test' },
    ]);
  });
});

describe('timingMiddleware', () => {
  it('sets startedAt, finishedAt, and durationMs on context', async () => {
    const pipeline = createMiddlewarePipeline([timingMiddleware]);
    const ctx = { jobName: 'timed-job' };
    await pipeline(ctx, async () => {});
    expect(ctx.startedAt).toBeDefined();
    expect(ctx.finishedAt).toBeDefined();
    expect(typeof ctx.durationMs).toBe('number');
    expect(ctx.durationMs).toBeGreaterThanOrEqual(0);
  });
});

describe('loggingMiddleware', () => {
  it('logs start and finish without throwing', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const pipeline = createMiddlewarePipeline([timingMiddleware, loggingMiddleware]);
    await pipeline({ jobName: 'logged-job' }, async () => {});
    expect(spy).toHaveBeenCalledTimes(2);
    spy.mockRestore();
  });
});
