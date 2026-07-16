import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import server from '../server/index.js';
import User from '../server/models/User.js';
import FitnessClass from '../server/models/FitnessClass.js';

const integrationUri = process.env.INTEGRATION_MONGODB_URI;
const run = integrationUri ? describe : describe.skip;
const { app } = server;

process.env.JWT_SECRET ||= 'integration-test-secret';
process.env.NODE_ENV = 'test';

const unique = Date.now();
const emailFor = name => `${name}.${unique}@fitflow.integration`;
const tokenFor = user => jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

async function createVerifiedUser({ name, role = 'member' }) {
  const password = await bcrypt.hash('Password@12345', 12);
  return User.create({
    name,
    email: emailFor(name.toLowerCase().replace(/\s+/g, '.')),
    password,
    role,
    isEmailVerified: true
  });
}

run('database-backed product flows', () => {
  beforeAll(async () => {
    await mongoose.connect(integrationUri);
  });

  afterAll(async () => {
    await User.deleteMany({ email: /@fitflow\.integration$/ });
    await FitnessClass.deleteMany({ title: /^Integration / });
    await mongoose.disconnect();
  });

  it('registers with OTP, verifies email, sends reset OTP, and resets password', async () => {
    const email = emailFor('signup');
    const register = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Integration Signup', email, password: 'Password@12345', goal: 'Stay active' })
      .expect(201);

    expect(register.body.verificationCode).toMatch(/^\d{6}$/);
    await request(app)
      .post('/api/auth/verify-email')
      .send({ email, code: register.body.verificationCode })
      .expect(200);

    const reset = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email })
      .expect(200);

    expect(reset.body.resetCode).toMatch(/^\d{6}$/);
    await request(app)
      .post('/api/auth/verify-reset-code')
      .send({ email, code: reset.body.resetCode })
      .expect(200);
    await request(app)
      .post('/api/auth/reset-password')
      .send({ email, code: reset.body.resetCode, password: 'NewPassword@12345' })
      .expect(200);
    await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'NewPassword@12345' })
      .expect(200);
  });

  it('books the final spot atomically and waitlists the next member', async () => {
    const first = await createVerifiedUser({ name: 'Integration First' });
    const second = await createVerifiedUser({ name: 'Integration Second' });
    const klass = await FitnessClass.create({
      title: 'Integration Capacity Check',
      category: 'Strength',
      coach: 'Demo Trainer',
      schedule: 'Mon - 6:00 PM',
      startsAt: new Date(Date.now() + 86400000),
      duration: 45,
      level: 'Beginner',
      capacity: 1
    });

    await request(app)
      .post(`/api/classes/${klass._id}/book`)
      .set('Authorization', `Bearer ${tokenFor(first)}`)
      .expect(200);

    const waitlist = await request(app)
      .post(`/api/classes/${klass._id}/book`)
      .set('Authorization', `Bearer ${tokenFor(second)}`)
      .expect(202);

    expect(waitlist.body.waitlisted).toBe(true);
    const updated = await FitnessClass.findById(klass._id);
    expect(updated.attendees.map(String)).toContain(String(first._id));
    expect(updated.waitlist.map(String)).toContain(String(second._id));
  });

  it('lets an admin promote a member to trainer', async () => {
    const admin = await createVerifiedUser({ name: 'Integration Admin', role: 'admin' });
    const member = await createVerifiedUser({ name: 'Integration Role Target' });

    const response = await request(app)
      .patch(`/api/admin/users/${member._id}/role`)
      .set('Authorization', `Bearer ${tokenFor(admin)}`)
      .send({ role: 'trainer' })
      .expect(200);

    expect(response.body.role).toBe('trainer');
    await expect(User.findById(member._id).then(user => user.role)).resolves.toBe('trainer');
  });

  it('requires admin-created classes to use a verified trainer account', async () => {
    const admin = await createVerifiedUser({ name: 'Integration Class Admin', role: 'admin' });
    const trainer = await createVerifiedUser({ name: 'Integration Class Trainer', role: 'trainer' });

    await request(app)
      .post('/api/admin/classes')
      .set('Authorization', `Bearer ${tokenFor(admin)}`)
      .send({
        title: 'Integration Trainer Assignment',
        category: 'Strength',
        schedule: 'Wed - 6:00 PM',
        startsAt: new Date(Date.now() + 86400000).toISOString(),
        duration: 45,
        level: 'Intermediate',
        capacity: 12
      })
      .expect(400);

    const response = await request(app)
      .post('/api/admin/classes')
      .set('Authorization', `Bearer ${tokenFor(admin)}`)
      .send({
        title: 'Integration Trainer Assignment',
        category: 'Strength',
        schedule: 'Wed - 6:00 PM',
        startsAt: new Date(Date.now() + 86400000).toISOString(),
        duration: 45,
        level: 'Intermediate',
        capacity: 12,
        trainer: trainer._id
      })
      .expect(201);

    expect(String(response.body.trainer)).toBe(String(trainer._id));
    expect(response.body.coach).toBe(trainer.name);
  });
});
