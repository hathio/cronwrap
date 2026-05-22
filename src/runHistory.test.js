const { createRunRecord, updateRunRecord, formatRecord } = require('./runHistory');

describe('runHistory', () => {
  describe('createRunRecord', () => {
    it('creates a record with required fields', () => {
      const record = createRunRecord('my-job');
      expect(record.jobName).toBe('my-job');
      expect(record.status).toBe('running');
      expect(record.startTime).toBeInstanceOf(Date);
      expect(record.endTime).toBeNull();
      expect(record.durationMs).toBeNull();
      expect(record.error).toBeNull();
    });

    it('generates a unique id for each record', () => {
      const r1 = createRunRecord('job-a');
      const r2 = createRunRecord('job-a');
      expect(r1.id).toBeDefined();
      expect(r2.id).toBeDefined();
      expect(r1.id).not.toBe(r2.id);
    });
  });

  describe('updateRunRecord', () => {
    it('marks a record as success', () => {
      const record = createRunRecord('my-job');
      const updated = updateRunRecord(record, { status: 'success' });
      expect(updated.status).toBe('success');
      expect(updated.endTime).toBeInstanceOf(Date);
      expect(updated.durationMs).toBeGreaterThanOrEqual(0);
    });

    it('marks a record as failed with an error', () => {
      const record = createRunRecord('my-job');
      const err = new Error('something broke');
      const updated = updateRunRecord(record, { status: 'failed', error: err });
      expect(updated.status).toBe('failed');
      expect(updated.error).toBe(err);
      expect(updated.endTime).toBeInstanceOf(Date);
    });

    it('does not mutate the original record', () => {
      const record = createRunRecord('my-job');
      updateRunRecord(record, { status: 'success' });
      expect(record.status).toBe('running');
    });
  });

  describe('formatRecord', () => {
    it('formats a success record as a readable string', () => {
      const record = createRunRecord('my-job');
      const updated = updateRunRecord(record, { status: 'success' });
      const str = formatRecord(updated);
      expect(str).toContain('my-job');
      expect(str).toContain('success');
      expect(str).toMatch(/\d+ms/);
    });

    it('formats a failed record and includes error message', () => {
      const record = createRunRecord('my-job');
      const updated = updateRunRecord(record, { status: 'failed', error: new Error('oops') });
      const str = formatRecord(updated);
      expect(str).toContain('failed');
      expect(str).toContain('oops');
    });
  });
});
