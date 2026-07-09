import { describe, expect, it, vi } from 'vitest';
import authMiddleware from '../server/middleware/auth.js';

const { requireVerified } = authMiddleware;

describe('verified account guard', () => {
  it('blocks unverified accounts from protected product areas', () => {
    const next = vi.fn();

    requireVerified({ user: { isEmailVerified: false } }, {}, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Please verify your email to continue',
      status: 403
    }));
  });

  it('allows verified accounts through', () => {
    const next = vi.fn();

    requireVerified({ user: { isEmailVerified: true } }, {}, next);

    expect(next).toHaveBeenCalledWith();
  });
});
