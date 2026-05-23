const {
  setPriority,
  getPriority,
  removePriority,
  comparePriority,
  sortJobsByPriority,
  getJobsByPriority,
  clearAllPriorities,
  VALID_LEVELS,
} = require('./jobPriority');

beforeEach(() => clearAllPriorities());

describe('setPriority', () => {
  test('sets a valid priority level', () => {
    setPriority('job-a', 'high');
    expect(getPriority('job-a').level).toBe('high');
  });

  test('defaults to normal when no level provided', () => {
    setPriority('job-b');
    expect(getPriority('job-b').level).toBe('normal');
  });

  test('throws on invalid level', () => {
    expect(() => setPriority('job-c', 'ultra')).toThrow('Invalid priority level');
  });
});

describe('getPriority', () => {
  test('returns normal defaults for unknown job', () => {
    const p = getPriority('unknown-job');
    expect(p.level).toBe('normal');
    expect(p.setAt).toBeNull();
  });

  test('returns stored priority info', () => {
    setPriority('job-d', 'critical');
    const p = getPriority('job-d');
    expect(p.level).toBe('critical');
    expect(p.value).toBe(3);
    expect(p.setAt).toBeTruthy();
  });
});

describe('removePriority', () => {
  test('removes a job priority', () => {
    setPriority('job-e', 'low');
    removePriority('job-e');
    expect(getPriority('job-e').level).toBe('normal');
  });

  test('returns false for non-existent job', () => {
    expect(removePriority('ghost')).toBe(false);
  });
});

describe('comparePriority', () => {
  test('higher priority job sorts first', () => {
    setPriority('job-low', 'low');
    setPriority('job-high', 'high');
    expect(comparePriority('job-high', 'job-low')).toBeLessThan(0);
  });

  test('equal priority preserves insertion order', () => {
    setPriority('job-first', 'normal');
    setPriority('job-second', 'normal');
    expect(comparePriority('job-first', 'job-second')).toBeLessThanOrEqual(0);
  });
});

describe('sortJobsByPriority', () => {
  test('sorts jobs from highest to lowest priority', () => {
    setPriority('j1', 'low');
    setPriority('j2', 'critical');
    setPriority('j3', 'normal');
    const sorted = sortJobsByPriority(['j1', 'j2', 'j3']);
    expect(sorted).toEqual(['j2', 'j3', 'j1']);
  });

  test('does not mutate original array', () => {
    const original = ['j1', 'j2'];
    sortJobsByPriority(original);
    expect(original).toEqual(['j1', 'j2']);
  });
});

describe('getJobsByPriority', () => {
  test('returns jobs matching the given level', () => {
    setPriority('ja', 'high');
    setPriority('jb', 'low');
    setPriority('jc', 'high');
    const highJobs = getJobsByPriority('high');
    expect(highJobs).toContain('ja');
    expect(highJobs).toContain('jc');
    expect(highJobs).not.toContain('jb');
  });

  test('throws on invalid level', () => {
    expect(() => getJobsByPriority('mega')).toThrow('Invalid priority level');
  });
});

describe('VALID_LEVELS', () => {
  test('contains expected levels', () => {
    expect(VALID_LEVELS).toEqual(['low', 'normal', 'high', 'critical']);
  });
});
