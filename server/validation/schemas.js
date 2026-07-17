const { z } = require('zod');

const email = z.string().trim().email().max(254).transform(value => value.toLowerCase());
const password = z.string().min(8).max(128);

module.exports = {
  register: z.object({ name: z.string().trim().min(2).max(60), email, password, goal: z.enum(['Build strength', 'Lose weight', 'Improve fitness', 'Stay active']).optional() }),
  login: z.object({ email, password: z.string().min(1).max(128) }),
  emailOnly: z.object({ email }),
  verifyCode: z.object({ email, code: z.string().regex(/^\d{6}$/).optional(), token: z.string().min(16).max(256).optional() }).refine(value => value.code || value.token, 'Verification code is required'),
  verifyResetCode: z.object({ email, code: z.string().regex(/^\d{6}$/) }),
  resetPassword: z.object({ email, code: z.string().optional(), token: z.string().optional(), password }).refine(value => value.code || value.token, 'Reset code is required'),
  workout: z.object({ type: z.string().trim().min(2).max(80), duration: z.coerce.number().int().min(1).max(600), calories: z.coerce.number().min(0).max(10000).optional(), intensity: z.enum(['Light', 'Moderate', 'Hard']).default('Moderate'), notes: z.string().max(500).optional() }),
  checkout: z.object({}).strict()
};
