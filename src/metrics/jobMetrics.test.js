const { recordRun, getMetrics, getAverageDuration, resetMetrics } = require('./jobMetrics');

describe('jobMetrics', () => {
  beforeEach(() => {
    resetMetrics();
  });

  describe('recordRun', () => {
    it('creates a new metric entry on first run', () => {
      recordRun('myJob', { durationMs: 200, success: true });
      const metric = getMetrics('myJob');
      expect(metric).not.toBeNull();
      expect(metric.totalRuns).toBe(1);
      expect(metric.successCount).toBe(1);
      expect(metric.failureCount).toBe(0);
    });

    it('increments failure count on failed run', () => {
      recordRun('myJob', { durationMs: 100, success: false });
      const metric = getMetrics('myJob');
      expect(metric.failureCount).toBe(1);
      expect(metric.successCount).toBe(0);
      expect(metric.lastStatus).toBe('failure');
    });

    it('accumulates multiple runs correctly', () => {
      recordRun('myJob', { durationMs: 100, success: true });
      recordRun('myJob', { durationMs: 300, success: true });
      recordRun('myJob', { durationMs: 200, success: false });
      const metric = getMetrics('myJob');
      expect(metric.totalRuns).toBe(3);
      expect(metric.successCount).toBe(2);
      expect(metric.failureCount).toBe(1);
      expect(metric.totalDurationMs).toBe(600);
    });

    it('tracks min and max duration', () => {
      recordRun('myJob', { durationMs: 150, success: true });
      recordRun('myJob', { durationMs: 50, success: true });
      recordRun('myJob', { durationMs: 400, success: true });
      const metric = getMetrics('myJob');
      expect(metric.minDurationMs).toBe(50);
      expect(metric.maxDurationMs).toBe(400);
    });

    it('sets lastRunAt as an ISO string', () => {
      recordRun('myJob', { durationMs: 100, success: true });
      const metric = getMetrics('myJob');
      expect(typeof metric.lastRunAt).toBe('string');
      expect(() => new Date(metric.lastRunAt)).not.toThrow();
    });
  });

  describe('getMetrics', () => {
    it('returns null for unknown job', () => {
      expect(getMetrics('unknown')).toBeNull();
    });

    it('returns all metrics when no jobName provided', () => {
      recordRun('jobA', { durationMs: 100, success: true });
      recordRun('jobB', { durationMs: 200, success: false });
      const all = getMetrics();
      expect(all).toHaveProperty('jobA');
      expect(all).toHaveProperty('jobB');
    });
  });

  describe('getAverageDuration', () => {
    it('returns 0 for unknown job', () => {
      expect(getAverageDuration('unknown')).toBe(0);
    });

    it('calculates average duration correctly', () => {
      recordRun('myJob', { durationMs: 100, success: true });
      recordRun('myJob', { durationMs: 300, success: true });
      expect(getAverageDuration('myJob')).toBe(200);
    });
  });

  describe('resetMetrics', () => {
    it('resets a single job', () => {
      recordRun('myJob', { durationMs: 100, success: true });
      resetMetrics('myJob');
      expect(getMetrics('myJob')).toBeNull();
    });

    it('resets all metrics when no jobName provided', () => {
      recordRun('jobA', { durationMs: 100, success: true });
      recordRun('jobB', { durationMs: 100, success: true });
      resetMetrics();
      expect(getMetrics()).toEqual({});
    });
  });
});
