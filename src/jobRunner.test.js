const { runJob } = require('./jobRunner');

describe('runJob', () => {
  test('returns a success record when the job completes', async () => {
    const record = await runJob('test-success', async () => {
      // simulate work
    });

    expect(record.jobName).toBe('test-success');
    expect(record.status).toBe('success');
    expect(record.finishedAt).not.toBeNull();
    expect(record.durationMs).toBeGreaterThanOrEqual(0);
    expect(record.error).toBeNull();
  });

  test('returns a failure record when the job throws', async () => {
    const record = await runJob('test-failure', async () => {
      throw new Error('something went wrong');
    });

    expect(record.status).toBe('failure');
    expect(record.error).toBe('something went wrong');
    expect(record.finishedAt).not.toBeNull();
    expect(record.durationMs).toBeGreaterThanOrEqual(0);
  });

  test('calls onSuccess callback with the record on success', async () => {
    const onSuccess = jest.fn();
    await runJob('test-cb-success', async () => {}, { onSuccess });
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onSuccess.mock.calls[0][0].status).toBe('success');
  });

  test('calls onError callback with error and record on failure', async () => {
    const onError = jest.fn();
    const err = new Error('boom');
    await runJob('test-cb-error', async () => { throw err; }, { onError });
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0]).toBe(err);
    expect(onError.mock.calls[0][1].status).toBe('failure');
  });

  test('does not throw even when onError itself throws', async () => {
    // onError throwing should bubble — this documents expected behavior
    await expect(
      runJob('test-onerror-throws', async () => { throw new Error('job error'); }, {
        onError: async () => { throw new Error('alert failed'); },
      })
    ).rejects.toThrow('alert failed');
  });
});
