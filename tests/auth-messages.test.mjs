import { describe, expect, it } from 'vitest';

describe('auth account guidance messages', () => {
  it('uses a clear login message when an email is not registered', () => {
    const message = 'No account found with this email. Please create an account first.';

    expect(message).toContain('create an account');
  });

  it('uses a clear forgot-password message when a first-time email is entered', () => {
    const message = 'No account found with this email. Please sign up first.';

    expect(message).toContain('sign up first');
  });
});
