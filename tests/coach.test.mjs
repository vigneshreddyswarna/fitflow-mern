import { describe, expect, it } from 'vitest';
import coach from '../server/services/coach.js';
import CoachingPlan from '../server/models/CoachingPlan.js';

const { generatePlan, rulesPlan, validPlan } = coach;

describe('Adaptive coach fallback', () => {
  const user = { goal: 'Build strength', profile: { availableDays: ['Monday', 'Wednesday', 'Saturday'], preferredMinutes: 35 } };

  it('creates a safe plan from profile data without an API key', () => {
    const plan = rulesPlan(user, [], []);
    expect(plan.source).toBe('rules');
    expect(plan.sessions).toHaveLength(3);
    expect(plan.sessions.every(session => session.minutes === 35)).toBe(true);
    expect(plan.sessions[0].instructions).toContain('Warm up');
    expect(plan.sessions[0].instructions).toContain('Progression');
    expect(validPlan(plan)).toBe(true);
  });

  it('uses available classes as context without telling users to book them', () => {
    const plan = rulesPlan(user, [], [{ title: 'Power Hour', category: 'Strength', schedule: 'Mon - 6:00 PM', duration: 50, level: 'Intermediate' }]);
    expect(plan.sessions.map(session => session.instructions).join(' ')).not.toMatch(/Book this/i);
    expect(plan.summary).toContain('stands on its own');
  });

  it('rejects malformed AI output', () => {
    expect(validPlan({ summary: 'Unsafe', sessions: [{ day: 'Someday', minutes: 1000 }] })).toBe(false);
    expect(validPlan(null)).toBeFalsy();
  });

  it('uses a booked class as the workout on its matching day', () => {
    const booked = { _id: 'class-1', title: 'Power Hour', category: 'Strength', schedule: 'Mon - 6:00 PM', duration: 50 };
    const plan = rulesPlan(user, [], [], [booked]);

    expect(plan.sessions[0]).toMatchObject({ title: 'Power Hour', minutes: 50, classId: 'class-1' });
    expect(plan.sessions[0].instructions).toContain('booked class');
  });

  it('adapts templates for weight-loss goals and recent workout volume', () => {
    const plan = rulesPlan({ ...user, goal: 'Lose weight' }, [{}, {}, {}, {}], []);
    expect(plan.sessions[0].title).toBe('Low-impact interval session');
    expect(plan.sessions.some(session => session.type === 'Mobility')).toBe(true);
  });

  it('returns the deterministic plan when no AI key is configured', async () => {
    const previousKey = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    await expect(generatePlan(user, [], [])).resolves.toMatchObject({ source: 'rules' });
    process.env.OPENAI_API_KEY = previousKey;
  });

  it('stores generated session type as a field, not the array schema type', async () => {
    const plan = new CoachingPlan({
      user: '64f000000000000000000001',
      weekOf: new Date(),
      ...rulesPlan(user, [], [])
    });
    await expect(plan.validate()).resolves.toBeUndefined();
    expect(plan.sessions[0].type).toBe('Strength');
  });
});
