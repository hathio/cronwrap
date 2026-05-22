const https = require('https');
const url = require('url');

/**
 * Send a Slack alert via an incoming webhook URL.
 * @param {object} message - { subject, body }
 * @param {object} config - { slackWebhookUrl }
 */
async function sendSlackAlert(message, config = {}) {
  const webhookUrl = config.slackWebhookUrl || process.env.CRONWRAP_SLACK_WEBHOOK;

  if (!webhookUrl) {
    throw new Error('Slack webhook URL is not configured.');
  }

  const payload = JSON.stringify({
    text: `*${message.subject}*\n\`\`\`${message.body}\`\`\``,
  });

  return new Promise((resolve, reject) => {
    const parsed = url.parse(webhookUrl);
    const options = {
      hostname: parsed.hostname,
      path: parsed.path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        resolve();
      } else {
        reject(new Error(`Slack responded with status ${res.statusCode}`));
      }
      res.resume();
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

module.exports = { sendSlackAlert };
