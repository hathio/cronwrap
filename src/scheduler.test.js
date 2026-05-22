const { scheduleJob, removeJob, listJobs } = require('./scheduler');
const jobRunner = require('./jobRunner');

jest.mock('./jobRunner');
jest.mock('node-cron', () => ({
  validate: jest.fn(),
  schedule: jest.fn(),
}));

const cron = require('node-cron');

describe('scheduler', () => {
  let mockTask;

  beforeEach(() => {
    jest.clearAllMocks();
    mockTask = { stop: jest.fn() };
    cron.validate.mockReturnValue(true);
    cron.schedule.mockReturnValue(mockTask);
    jobRunner.runJob = jest.fn().mockResolvedValue({ status: 'success' });

    // clear internal map between tests
    listJobs().forEach(({ name }) => removeJob(name));
  });

  describe('scheduleJob', () => {
    it('should schedule a valid job and return the task handle', () => {
      const task = jest.fn();
      const result = scheduleJob('test-job', '0 * * * *', task);
      expect(cron.validate).toHaveBeenCalledWith('0 * * * *');
      expect(cron.schedule).toHaveBeenCalled();
      expect(result).toBe(mockTask);
    });

    it('should throw if cron expression is invalid', () => {
      cron.validate.mockReturnValue(false);
      expect(() => scheduleJob('bad-job', 'not-valid', jest.fn()))
        .toThrow('Invalid cron expression: "not-valid"');
    });

    it('should throw if a job with the same name already exists', () => {
      scheduleJob('duplicate', '0 * * * *', jest.fn());
      expect(() => scheduleJob('duplicate', '0 * * * *', jest.fn()))
        .toThrow('A job with the name "duplicate" is already scheduled.');
    });

    it('should invoke runJob when the cron fires', async () => {
      const task = jest.fn();
      scheduleJob('fire-test', '0 * * * *', task, { alertOnFailure: true });

      // Grab the callback passed to cron.schedule and invoke it
      const cronCallback = cron.schedule.mock.calls[0][1];
      await cronCallback();

      expect(jobRunner.runJob).toHaveBeenCalledWith('fire-test', task, { alertOnFailure: true });
    });
  });

  describe('removeJob', () => {
    it('should stop and remove an existing job', () => {
      scheduleJob('removable', '0 * * * *', jest.fn());
      const result = removeJob('removable');
      expect(result).toBe(true);
      expect(mockTask.stop).toHaveBeenCalled();
      expect(listJobs().find(j => j.name === 'removable')).toBeUndefined();
    });

    it('should return false when job does not exist', () => {
      expect(removeJob('nonexistent')).toBe(false);
    });
  });

  describe('listJobs', () => {
    it('should return details for all scheduled jobs', () => {
      scheduleJob('job-a', '0 * * * *', jest.fn(), { timezone: 'America/New_York' });
      scheduleJob('job-b', '*/5 * * * *', jest.fn());
      const jobs = listJobs();
      expect(jobs).toHaveLength(2);
      expect(jobs[0]).toMatchObject({ name: 'job-a', cronExpression: '0 * * * *', timezone: 'America/New_York' });
      expect(jobs[1]).toMatchObject({ name: 'job-b', cronExpression: '*/5 * * * *', timezone: 'UTC' });
    });
  });
});
