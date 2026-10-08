const { z } = require('zod');
const { registerSchema } = require('./authValidator');

const createUserSchema = registerSchema.extend({
  role: z.enum(['admin', 'sales_manager', 'sales_executive']),
  isActive: z.boolean().optional(),
  manager: z.string().optional(),
});

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().regex(/^(?:\+91|91)?[6-9]\d{9}$/).optional(),
  role: z.enum(['admin', 'sales_manager', 'sales_executive']).optional(),
  manager: z.string().optional().nullable(),
});

module.exports = {
  createUserSchema,
  updateUserSchema,
};
