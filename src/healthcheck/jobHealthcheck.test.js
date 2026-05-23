const {
  recordSuccess,
  recordFailure,
  getHealth,
  resetHealth,
  clearAllHealth,
  getAllHealth,
} = require('./jobHealthcheck');

beforeEach(() => {
  clearAllHealth();
});

describe('getHealth', () => {
  it('returns null for unknown job', () => {
    expect(getHealth('unknown')).toBeNull();
  });

  it('creates health record on first record call', () => {
    recordSuccess('job1');
    const h = getHealth('job1');
    expect(h).not.toBeNull();
    expect(h.jobId).toBe('job1');
  });
});

describe('recordSuccess', () => {
  it('sets status to healthy', () => {
    recordSuccess('job1');
    expect(getHealth('job1').status).toBe('healthy');
  });

  it('resets consecutive failures', () => {
    recordFailure('job1');
    recordFailure('job1');
    recordSuccess('job1');
    expect(getHealth('job1').consecutiveFailures).toBe(0);
    expect(getHealth('job1').status).toBe('healthy');
  });
});

describe('recordFailure', () => {
  it('increments consecutive failures', () => {
    recordFailure('job1');
    recordFailure('job1');
    expect(getHealth('job1').consecutiveFailures).toBe(2);
  });

  it('marks unhealthy after hitting failure threshold', () => {
    recordFailure('job1');
    recordFailure('job1');
    recordFailure('job1');
    expect(getHealth('job1').status).toBe('unhealthy');
  });

  it('marks degraded when failure rate exceeds threshold', () => {
    // 4 failures out of 6 runs = ~67% failure rate
    recordSuccess('job2');
    recordSuccess('job2');
    recordFailure('job2');
    recordFailure('job2');
    recordFailure('job2');
    recordFailure('job2');
    expect(getHealth('job2').status).toBe('degraded');
  });
});

describe('resetHealth', () => {
  it('removes health record for job', () => {
    recordFailure('job1');
    resetHealth('job1');
    expect(getHealth('job1')).toBeNull();
  });
});

describe('getAllHealth', () => {
  it('returns summary for all tracked jobs', () => {
    recordSuccess('jobA');
    recordFailure('jobB');
    const all = getAllHealth();
    expect(all).toHaveLength(2);
    const ids = all.map(h => h.jobId);
    expect(ids).toContain('jobA');
    expect(ids).toContain('jobB');
  });

  it('includes status and consecutiveFailures in summary', () => {
    recordFailure('jobC');
    const all = getAllHealth();
    const entry = all.find(h => h.jobId === 'jobC');
    expect(entry.status).toBe('healthy');
    expect(entry.consecutiveFailures).toBe(1);
    expect(entry.totalRecentRuns).toBe(1);
  });
});
