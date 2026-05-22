const nodemailer = require('nodemailer');

/**
 * Send an email alert using nodemailer.
 * @param {object} message - { subject, body }
 * @param {object} config - { emailFrom, emailTo, smtpHost, smtpPort, smtpUser, smtpPass }
 */
async function sendEmailAlert(message, config = {}) {
  const host = config.smtpHost || process.env.CRONWRAP_SMTP_HOST;
  const port = config.smtpPort || process.env.CRONWRAP_SMTP_PORT || 587;
  const user = config.smtpUser || process.env.CRONWRAP_SMTP_USER;
  const pass = config.smtpPass || process.env.CRONWRAP_SMTP_PASS;
  const from = config.emailFrom || process.env.CRONWRAP_EMAIL_FROM;
  const to = config.emailTo || process.env.CRONWRAP_EMAIL_TO;

  if (!host || !from || !to) {
    throw new Error('Email alert configuration is incomplete (smtpHost, emailFrom, emailTo required).');
  }

  const transporter = nodemailer.createTransport({
    host,
    port: Number(port),
    secure: Number(port) === 465,
    auth: user && pass ? { user, pass } : undefined,
  });

  await transporter.sendMail({
    from,
    to,
    subject: message.subject,
    text: message.body,
  });
}

module.exports = { sendEmailAlert };
