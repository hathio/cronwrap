const {
  createThrottle,
  getThrottle,
  checkThrottle,
  removeThrottle,
  clearAllThrottles,
} = require('./jobThrottle');

beforeEach(() => {
  clearAllThrottles();
});

describe('createThrottle', () => {
  it('creates and stores a throttle config', () => {
    const t = createThrottle('myJob', 5000);
    expect(t.jobName).toBe('myJob');
    expect(t.windowMs).toBe(5000);
    expect(t.timestamps).toEqual([]);
  });

  it('throws if jobName is missing', () => {
    expect(() => createThrottle('', 5000)).toThrow('jobName');
  });

  it('throws if windowMs is invalid', () => {
    expect(() => createThrottle('job', -100)).toThrow('windowMs');
  });
});

describe('getThrottle', () => {
  it('returns null for unknown job', () => {
    expect(getThrottle('unknown')).toBeNull();
  });

  it('returns throttle after creation', () => {
    createThrottle('jobA', 1000);
    expect(getThrottle('jobA')).not.toBeNull();
  });
});

describe('checkThrottle', () => {
  it('allows run when no throttle is set', () => {
    expect(checkThrottle('noThrottleJob')).toBe(true);
  });

  it('allows first run within limit', () => {
    createThrottle('jobB', 5000);
    expect(checkThrottle('jobB', 2)).toBe(true);
  });

  it('blocks run when limit exceeded', () => {
    createThrottle('jobC', 5000);
    checkThrottle('jobC', 1); // first run — allowed
    expect(checkThrottle('jobC', 1)).toBe(false); // second — blocked
  });

  it('allows run again after window expires', () => {
    jest.useFakeTimers();
    createThrottle('jobD', 1000);
    checkThrottle('jobD', 1);
    jest.advanceTimersByTime(1100);
    expect(checkThrottle('jobD', 1)).toBe(true);
    jest.useRealTimers();
  });
});

describe('removeThrottle', () => {
  it('removes a throttle', () => {
    createThrottle('jobE', 3000);
    removeThrottle('jobE');
    expect(getThrottle('jobE')).toBeNull();
  });
});
