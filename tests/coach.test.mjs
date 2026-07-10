import { describe, expect, it } from 'vitest';
import coach from '../server/services/coach.js';
import CoachingPlan from '../server/models/CoachingPlan.js';

const { rulesPlan, validPlan } = coach;

describe('Adaptive coach fallback', () => {
  const user = { goal: 'Build strength', profile: { availableDays: ['Monday', 'Wednesday', 'Saturday'], preferredMinutes: 35 } };

  it('creates a safe plan from profile data without an API key', () => {
    const plan = rulesPlan(user, [], []);
    expect(plan.source).toBe('rules');
    expect(plan.sessions).toHaveLength(3);
    expect(plan.sessions.every(session => session.minutes === 35)).toBe(true);
    expect(validPlan(plan)).toBe(true);
  });

  it('rejects malformed AI output', () => {
    expect(validPlan({ summary: 'Unsafe', sessions: [{ day: 'Someday', minutes: 1000 }] })).toBe(false);
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
