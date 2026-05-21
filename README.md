# cronwrap

A thin wrapper around cron jobs that adds logging, alerting, and run history.

## Installation

```bash
npm install cronwrap
```

## Usage

```javascript
const cronwrap = require('cronwrap');

const job = cronwrap.schedule('0 * * * *', async () => {
  // your job logic here
  await syncData();
}, {
  name: 'data-sync',
  alertOnFailure: true,
  historyLimit: 50,
});

job.start();
```

cronwrap wraps your existing cron tasks and automatically:

- **Logs** start time, end time, and duration for every run
- **Alerts** you (via webhook or email) when a job fails or exceeds a timeout
- **Stores run history** so you can inspect past executions and error traces

### Accessing Run History

```javascript
const history = job.getHistory();
// [{ runAt, duration, status, error }, ...]
console.log(history);
```

### Configuration Options

| Option | Type | Description |
|---|---|---|
| `name` | `string` | Human-readable job identifier |
| `alertOnFailure` | `boolean` | Send alert when job throws an error |
| `alertWebhook` | `string` | Webhook URL to POST alerts to |
| `historyLimit` | `number` | Max number of past runs to retain (default: `100`) |
| `timeout` | `number` | Alert if job runs longer than N milliseconds |

## License

MIT