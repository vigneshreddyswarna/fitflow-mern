const nodemailer = require('nodemailer');

function previewEmail({ to, subject, text }) {
  console.log(`[Email preview] To: ${to} | ${subject} | ${text}`);
  return { preview: true };
}

const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[character]));

function emailBody({ subject, text }) {
  return `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#172015"><h2>${escapeHtml(subject)}</h2><p>${escapeHtml(text)}</p></div>`;
}

async function sendEmailWithBrevoApi({ to, subject, text, senderEmail }) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return null;
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      sender: { name: 'FitFlow', email: senderEmail },
      to: [{ email: to }],
      subject,
      htmlContent: emailBody({ subject, text }),
      textContent: text
    })
  });
  if (!response.ok) throw new Error(`Brevo API failed: ${await response.text()}`);
  return { provider: 'brevo-api' };
}

async function sendEmail({ to, subject, text }) {
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const senderEmail = process.env.SENDER_EMAIL || process.env.SMTP_USER || process.env.BREVO_SENDER_EMAIL;
  const apiResult = await sendEmailWithBrevoApi({ to, subject, text, senderEmail });
  if (apiResult) return apiResult;
  if (!smtpUser || !smtpPass || !senderEmail) {
    return previewEmail({ to, subject, text });
  }
  const basePort = Number(process.env.SMTP_PORT || 587);
  const fallbackPorts = basePort === 587 ? [587, 2525] : [basePort];
  let lastError;
  for (const port of fallbackPorts) {
    try {
      const transport = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
        port,
        secure: process.env.SMTP_SECURE === 'true',
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 20000,
        disableFileAccess: true,
        disableUrlAccess: true,
        auth: { user: smtpUser, pass: smtpPass }
      });
      const response = await transport.sendMail({
        from: { name: 'FitFlow', address: senderEmail },
        to,
        subject,
        html: emailBody({ subject, text }),
        text
      });
      if (response.rejected?.length) throw new Error('Email provider rejected the recipient');
      return response;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

module.exports = { sendEmail };
