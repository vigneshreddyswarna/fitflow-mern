import { afterEach, describe, expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import authMiddleware from '../server/middleware/auth.js';
import roles from '../server/middleware/roles.js';
import validate from '../server/middleware/validate.js';
import User from '../server/models/User.js';

const originalSecret = process.env.JWT_SECRET;

afterEach(() => {
  process.env.JWT_SECRET = originalSecret;
  vi.restoreAllMocks();
});

describe('authentication middleware', () => {
  it('rejects requests without a session or bearer token', () => {
    const next = vi.fn();
    authMiddleware({ cookies: {}, header: vi.fn() }, {}, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Please sign in to continue', status: 401 }));
  });

  it('rejects an invalid bearer token', () => {
    process.env.JWT_SECRET = 'middleware-test-secret';
    const next = vi.fn();
    authMiddleware({ cookies: {}, header: () => 'Bearer invalid-token' }, {}, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));
  });

  it('loads the current user from a valid cookie session', async () => {
    process.env.JWT_SECRET = 'middleware-test-secret';
    const token = jwt.sign({ id: '64f000000000000000000001' }, process.env.JWT_SECRET);
    vi.spyOn(User, 'findById').mockReturnValue({
      select: () => ({
        lean: () => Promise.resolve({
          _id: '64f000000000000000000001', name: 'Test Member', role: 'member',
          isEmailVerified: true, demoAccount: false
        })
      })
    });
    const req = { cookies: { fitflow_session: token }, header: vi.fn() };
    const next = vi.fn();

    authMiddleware(req, {}, next);
    await vi.waitFor(() => expect(next).toHaveBeenCalledWith());

    expect(req.user).toEqual({
      id: '64f000000000000000000001', name: 'Test Member', role: 'member',
      isEmailVerified: true, demoAccount: false
    });
    expect(req.header).not.toHaveBeenCalled();
  });

  it('rejects a valid token when its account no longer exists', async () => {
    process.env.JWT_SECRET = 'middleware-test-secret';
    const token = jwt.sign({ id: '64f000000000000000000001' }, process.env.JWT_SECRET);
    vi.spyOn(User, 'findById').mockReturnValue({ select: () => ({ lean: () => Promise.resolve(null) }) });
    const next = vi.fn();

    authMiddleware({ cookies: {}, header: () => `Bearer ${token}` }, {}, next);
    await vi.waitFor(() => expect(next).toHaveBeenCalled());

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Account no longer exists', status: 401 }));
  });
});

describe('authorization and validation middleware', () => {
  it('allows listed roles and rejects other roles', () => {
    const guard = roles('admin', 'trainer');
    const allowed = vi.fn();
    const denied = vi.fn();

    guard({ user: { role: 'trainer' } }, {}, allowed);
    guard({ user: { role: 'member' } }, {}, denied);

    expect(allowed).toHaveBeenCalledWith();
    expect(denied).toHaveBeenCalledWith(expect.objectContaining({ status: 403 }));
  });

  it('normalizes valid input and reports invalid input consistently', () => {
    const middleware = validate(z.object({ name: z.string().trim().min(2) }));
    const validReq = { body: { name: '  Vignesh  ' } };
    const validNext = vi.fn();
    const invalidNext = vi.fn();

    middleware(validReq, {}, validNext);
    middleware({ body: { name: ' ' } }, {}, invalidNext);

    expect(validReq.body).toEqual({ name: 'Vignesh' });
    expect(validNext).toHaveBeenCalledWith();
    expect(invalidNext).toHaveBeenCalledWith(expect.objectContaining({ status: 400, code: 'VALIDATION_ERROR' }));
  });
});
