const { alertOnFailure, buildAlertMessage } = require('./alertManager');
const slackAlert = require('./slackAlert');
const emailAlert = require('./emailAlert');

jest.mock('./slackAlert');
jest.mock('./emailAlert');

const failedRecord = {
  jobName: 'cleanup-job',
  status: 'failed',
  startedAt: '2024-01-15T10:00:00.000Z',
  durationMs: 1200,
  error: 'ENOENT: file not found',
};

const successRecord = {
  jobName: 'cleanup-job',
  status: 'success',
  startedAt: '2024-01-15T10:00:00.000Z',
  durationMs: 800,
  error: null,
};

beforeEach(() => {
  jest.clearAllMocks();
  slackAlert.sendSlackAlert.mockResolvedValue();
  emailAlert.sendEmailAlert.mockResolvedValue();
});

test('sends slack alert on failure', async () => {
  await alertOnFailure(failedRecord, { channels: ['slack'], slackWebhookUrl: 'https://hooks.slack.com/test' });
  expect(slackAlert.sendSlackAlert).toHaveBeenCalledTimes(1);
  const [msg] = slackAlert.sendSlackAlert.mock.calls[0];
  expect(msg.subject).toContain('cleanup-job');
  expect(msg.body).toContain('ENOENT');
});

test('sends email alert on failure', async () => {
  await alertOnFailure(failedRecord, { channels: ['email'] });
  expect(emailAlert.sendEmailAlert).toHaveBeenCalledTimes(1);
});

test('sends both channels when configured', async () => {
  await alertOnFailure(failedRecord, { channels: ['slack', 'email'] });
  expect(slackAlert.sendSlackAlert).toHaveBeenCalledTimes(1);
  expect(emailAlert.sendEmailAlert).toHaveBeenCalledTimes(1);
});

test('does not alert on success without slow threshold', async () => {
  await alertOnFailure(successRecord, { channels: ['slack'] });
  expect(slackAlert.sendSlackAlert).not.toHaveBeenCalled();
});

test('alerts on slow job exceeding maxDurationMs', async () => {
  await alertOnFailure(successRecord, { channels: ['slack'], maxDurationMs: 500 });
  expect(slackAlert.sendSlackAlert).toHaveBeenCalledTimes(1);
  const [msg] = slackAlert.sendSlackAlert.mock.calls[0];
  expect(msg.subject).toContain('exceeded duration');
});

test('does not alert when no channels configured', async () => {
  await alertOnFailure(failedRecord, {});
  expect(slackAlert.sendSlackAlert).not.toHaveBeenCalled();
  expect(emailAlert.sendEmailAlert).not.toHaveBeenCalled();
});

test('buildAlertMessage includes all fields', () => {
  const msg = buildAlertMessage(failedRecord, 'Job failed');
  expect(msg.subject).toBe('[cronwrap] Job failed: cleanup-job');
  expect(msg.body).toContain('failed');
  expect(msg.body).toContain('1200ms');
  expect(msg.body).toContain('ENOENT');
});
