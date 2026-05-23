const { createTagMiddleware } = require('./tagMiddleware');
const { setTags, clearAllTags } = require('./jobTags');

beforeEach(() => {
  clearAllTags();
});

function makeContext(jobName) {
  return { jobName };
}

describe('createTagMiddleware', () => {
  it('attaches tags to context', async () => {
    setTags('reportJob', ['critical', 'daily']);
    const middleware = createTagMiddleware();
    const context = makeContext('reportJob');
    await middleware(context, async () => {});
    expect(context.tags).toEqual(['critical', 'daily']);
  });

  it('attaches empty array if job has no tags', async () => {
    const middleware = createTagMiddleware();
    const context = makeContext('unknownJob');
    await middleware(context, async () => {});
    expect(context.tags).toEqual([]);
  });

  it('calls next', async () => {
    const middleware = createTagMiddleware();
    const context = makeContext('someJob');
    const next = jest.fn();
    await middleware(context, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('tags are available in next middleware', async () => {
    setTags('pipelineJob', ['etl']);
    const middleware = createTagMiddleware();
    const context = makeContext('pipelineJob');
    let tagsInNext;
    await middleware(context, async () => {
      tagsInNext = context.tags;
    });
    expect(tagsInNext).toEqual(['etl']);
  });
});
