import { z } from 'zod';
import { email } from '../../utils/zod.js';

const password = z
  .string()
  .min(8, { error: 'Password must be at least 8 characters' })
  .max(128, { error: 'Password must be at most 128 characters' });

export const adminLoginSchema = z.object({
  email,
  password: z.string().min(1, { error: 'Password is required' }),
});

export const adminRegisterSchema = z.object({
  email,
  password,
  name: z.string().trim().min(1).max(100).optional(),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
export type AdminRegisterInput = z.infer<typeof adminRegisterSchema>;
