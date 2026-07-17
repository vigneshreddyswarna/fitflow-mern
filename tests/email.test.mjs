import { afterEach, describe, expect, it, vi } from 'vitest';
import emailService from '../server/services/email.js';
import nodemailer from 'nodemailer';

const { sendEmail } = emailService;
const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
  vi.restoreAllMocks();
});

describe('email delivery fallback', () => {
  it('prints a local preview when no provider is configured', async () => {
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    delete process.env.SENDER_EMAIL;
    delete process.env.BREVO_API_KEY;
    delete process.env.BREVO_SENDER_EMAIL;
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});

    const result = await sendEmail({ to: 'member@example.com', subject: 'OTP', text: 'Code 123456' });

    expect(result).toEqual({ preview: true });
    expect(log).toHaveBeenCalledWith(expect.stringContaining('member@example.com'));
  });

  it('uses the Brevo API when configured so OTPs do not depend on SMTP ports', async () => {
    process.env.BREVO_API_KEY = 'test-api-key';
    process.env.BREVO_SENDER_EMAIL = 'hello@fitflow.test';
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);

    const result = await sendEmail({ to: 'member@example.com', subject: 'OTP', text: 'Code 123456' });

    expect(result).toEqual({ provider: 'brevo-api' });
    expect(fetchMock).toHaveBeenCalledWith('https://api.brevo.com/v3/smtp/email', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ 'api-key': 'test-api-key' })
    }));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({
      sender: { name: 'FitFlow', email: 'hello@fitflow.test' },
      to: [{ email: 'member@example.com' }],
      subject: 'OTP',
      textContent: 'Code 123456'
    });
  });

  it('escapes HTML before sending through the Brevo API', async () => {
    process.env.BREVO_API_KEY = 'test-api-key';
    process.env.BREVO_SENDER_EMAIL = 'hello@fitflow.test';
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);

    await sendEmail({ to: 'member@example.com', subject: '<Welcome>', text: 'Use code <123456>' });

    const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(payload.htmlContent).toContain('&lt;Welcome&gt;');
    expect(payload.htmlContent).toContain('&lt;123456&gt;');
    expect(payload.htmlContent).not.toContain('<123456>');
  });

  it('surfaces a useful error when the Brevo API rejects delivery', async () => {
    process.env.BREVO_API_KEY = 'test-api-key';
    process.env.BREVO_SENDER_EMAIL = 'hello@fitflow.test';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, text: async () => 'invalid sender' }));

    await expect(sendEmail({ to: 'member@example.com', subject: 'OTP', text: 'Code' }))
      .rejects.toThrow('Brevo API failed: invalid sender');
  });

  it('retries SMTP on the fallback port and rejects provider rejections', async () => {
    delete process.env.BREVO_API_KEY;
    process.env.SMTP_USER = 'smtp-user';
    process.env.SMTP_PASS = 'smtp-pass';
    process.env.SENDER_EMAIL = 'hello@fitflow.test';
    process.env.SMTP_PORT = '587';
    const sendMail = vi.fn()
      .mockRejectedValueOnce(new Error('port blocked'))
      .mockResolvedValueOnce({ accepted: [], rejected: ['member@example.com'] });
    const createTransport = vi.spyOn(nodemailer, 'createTransport').mockReturnValue({ sendMail });

    await expect(sendEmail({ to: 'member@example.com', subject: 'OTP', text: 'Code' }))
      .rejects.toThrow('Email provider rejected the recipient');

    expect(createTransport.mock.calls.map(([options]) => options.port)).toEqual([587, 2525]);
    expect(createTransport.mock.calls[0][0]).toMatchObject({ disableFileAccess: true, disableUrlAccess: true });
  });
});
