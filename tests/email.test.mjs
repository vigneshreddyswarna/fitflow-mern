import { afterEach, describe, expect, it, vi } from 'vitest';
import emailService from '../server/services/email.js';

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
});
