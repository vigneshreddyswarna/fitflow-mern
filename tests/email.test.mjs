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
    delete process.env.EMAILJS_SERVICE_ID;
    delete process.env.EMAILJS_TEMPLATE_ID;
    delete process.env.EMAILJS_PUBLIC_KEY;
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});

    const result = await sendEmail({ to: 'member@example.com', subject: 'OTP', text: 'Code 123456' });

    expect(result).toEqual({ preview: true });
    expect(log).toHaveBeenCalledWith(expect.stringContaining('member@example.com'));
  });
});
