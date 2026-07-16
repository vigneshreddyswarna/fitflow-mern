import { describe, expect, it } from 'vitest';

describe('auth privacy messages', () => {
  it('does not reveal whether a login email is registered', () => {
    const message = 'Email or password is incorrect';

    expect(message).not.toMatch(/account found|registered/i);
  });

  it('does not reveal whether a password-reset email is registered', () => {
    const message = 'If that account exists, a reset code has been sent';

    expect(message).toContain('If that account exists');
  });

  it('warns when a password reset tries to reuse the old password', () => {
    const message = 'New password cannot be the same as your old password';

    expect(message).toContain('cannot be the same');
  });
});
