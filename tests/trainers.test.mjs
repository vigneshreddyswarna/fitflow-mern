import { describe, expect, it } from 'vitest';
import request from 'supertest';
import server from '../server/index.js';

const { app } = server;

describe('Public trainer profiles', () => {
  it('rejects malformed trainer ids before querying the database', async () => {
    const response = await request(app).get('/api/trainers/not-a-valid-id').expect(400);

    expect(response.body.message).toBe('Invalid trainer id');
  });
});
