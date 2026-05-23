const {
  setDependencies,
  getDependencies,
  markCompleted,
  markFailed,
  areDependenciesMet,
  getUnmetDependencies,
  removeDependencies,
  clearAll,
  getCompletedJobs,
} = require('./jobDependencies');
const { createDependencyMiddleware } = require('./dependencyMiddleware');

beforeEach(() => clearAll());

describe('jobDependencies', () => {
  test('setDependencies and getDependencies', () => {
    setDependencies('jobB', ['jobA']);
    expect(getDependencies('jobB')).toEqual(['jobA']);
  });

  test('getDependencies returns empty array for unknown job', () => {
    expect(getDependencies('unknown')).toEqual([]);
  });

  test('setDependencies throws on non-array', () => {
    expect(() => setDependencies('jobB', 'jobA')).toThrow();
  });

  test('areDependenciesMet returns true when no deps', () => {
    expect(areDependenciesMet('jobA')).toBe(true);
  });

  test('areDependenciesMet returns false when dep not completed', () => {
    setDependencies('jobB', ['jobA']);
    expect(areDependenciesMet('jobB')).toBe(false);
  });

  test('areDependenciesMet returns true after dep completes', () => {
    setDependencies('jobB', ['jobA']);
    markCompleted('jobA');
    expect(areDependenciesMet('jobB')).toBe(true);
  });

  test('getUnmetDependencies lists only unmet', () => {
    setDependencies('jobC', ['jobA', 'jobB']);
    markCompleted('jobA');
    expect(getUnmetDependencies('jobC')).toEqual(['jobB']);
  });

  test('markFailed removes from completed', () => {
    markCompleted('jobA');
    markFailed('jobA');
    expect(getCompletedJobs()).not.toContain('jobA');
  });

  test('removeDependencies clears deps for job', () => {
    setDependencies('jobB', ['jobA']);
    removeDependencies('jobB');
    expect(getDependencies('jobB')).toEqual([]);
  });
});

describe('createDependencyMiddleware', () => {
  test('calls next and marks completed when deps met', async () => {
    const middleware = createDependencyMiddleware();
    const ctx = { jobName: 'jobA' };
    const next = jest.fn().mockResolvedValue();
    await middleware(ctx, next);
    expect(next).toHaveBeenCalled();
    expect(getCompletedJobs()).toContain('jobA');
  });

  test('throws DEPENDENCY_UNMET when deps not met', async () => {
    setDependencies('jobB', ['jobA']);
    const middleware = createDependencyMiddleware();
    const ctx = { jobName: 'jobB' };
    const next = jest.fn();
    await expect(middleware(ctx, next)).rejects.toMatchObject({
      code: 'DEPENDENCY_UNMET',
      unmetDependencies: ['jobA'],
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('marks failed and rethrows when next throws', async () => {
    markCompleted('jobA');
    setDependencies('jobB', ['jobA']);
    markCompleted('jobA');
    const middleware = createDependencyMiddleware();
    const ctx = { jobName: 'jobB' };
    const next = jest.fn().mockRejectedValue(new Error('boom'));
    await expect(middleware(ctx, next)).rejects.toThrow('boom');
    expect(getCompletedJobs()).not.toContain('jobB');
  });
});
