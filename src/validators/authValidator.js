const { z } = require('zod');
const mongoose = require('mongoose');

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

const phoneRegex = /^(?:\+91|91)?[6-9]\d{9}$/;

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  phone: z.string().regex(phoneRegex, 'Invalid Indian mobile number'),
  password: passwordSchema,
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

const objectIdSchema = z.object({
  id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: 'Invalid ID format',
  }),
});

module.exports = {
  registerSchema,
  loginSchema,
  objectIdSchema,
};
