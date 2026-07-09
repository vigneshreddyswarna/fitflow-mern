const nodemailer = require('nodemailer');

function previewEmail({ to, subject, text }) {
  console.log(`[Email preview] To: ${to} | ${subject} | ${text}`);
  return { preview: true };
}

const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[character]));

function emailBody({ subject, text }) {
  return `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#172015"><h2>${escapeHtml(subject)}</h2><p>${escapeHtml(text)}</p></div>`;
}

async function sendEmailWithEmailJs({ to, subject, text }) {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  if (!serviceId || !templateId || !publicKey) return null;

  const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: serviceId,
      template_id: templateId,
      user_id: publicKey,
      accessToken: process.env.EMAILJS_PRIVATE_KEY || undefined,
      template_params: {
        to_email: to,
        to_name: to.split('@')[0],
        subject,
        message: text,
        app_name: 'FitFlow'
      }
    })
  });

  if (!response.ok) throw new Error(`EmailJS failed: ${await response.text()}`);
  return { provider: 'emailjs' };
}

async function sendEmail({ to, subject, text }) {
  const emailJsResult = await sendEmailWithEmailJs({ to, subject, text });
  if (emailJsResult) return emailJsResult;

  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const senderEmail = process.env.SENDER_EMAIL || process.env.SMTP_USER;
  if (!smtpUser || !smtpPass || !senderEmail) {
    return previewEmail({ to, subject, text });
  }
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
    port: Number(process.env.SMTP_PORT || 587),
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
}

module.exports = { sendEmail };
