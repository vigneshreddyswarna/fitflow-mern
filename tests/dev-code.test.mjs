import { afterEach, describe, expect, it } from 'vitest';
import devCode from '../server/utils/dev-code.js';

const { devOnlyCode } = devCode;
const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe('dev-only OTP response helper', () => {
  it('includes OTP codes outside production for local testing', () => {
    process.env.NODE_ENV = 'test';

    expect(devOnlyCode('verificationCode', '123456')).toEqual({ verificationCode: '123456' });
  });

  it('hides OTP codes in production responses', () => {
    process.env.NODE_ENV = 'production';

    expect(devOnlyCode('verificationCode', '123456')).toEqual({});
  });
});
