import { describe, expect, it } from 'vitest';
import request from 'supertest';
import server from '../server/index.js';

const { app } = server;

describe('API health', () => {
  it('reports service and database state without exposing secrets', async () => {
    const response = await request(app).get('/api/health').expect(200);
    expect(response.body.status).toBe('ok');
    expect(['connected', 'disconnected']).toContain(response.body.database);
    expect(JSON.stringify(response.body)).not.toContain('JWT_SECRET');
  });
});
