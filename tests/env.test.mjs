import { afterEach, describe, expect, it } from 'vitest';
import server from '../server/index.js';

const { validateEnv } = server;
const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe('startup environment validation', () => {
  it('requires the database URI and JWT secret before starting', () => {
    delete process.env.MONGODB_URI;
    delete process.env.JWT_SECRET;

    expect(() => validateEnv()).toThrow(/MONGODB_URI, JWT_SECRET are missing/);
  });

  it('passes when required runtime secrets are configured', () => {
    process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/fitflow-test';
    process.env.JWT_SECRET = 'test-secret-with-enough-entropy';

    expect(() => validateEnv()).not.toThrow();
  });
});
