const { z } = require('zod');
const mongoose = require('mongoose');

const phoneRegex = /^(?:\+91|91)?[6-9]\d{9}$/;

const createCustomerSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  phone: z.string().regex(phoneRegex, 'Invalid Indian mobile number').optional().or(z.literal('')),
  company: z.string().optional(),
  address: z.string().optional(),
  assignedTo: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), { message: 'Invalid ID format' }).optional(),
});

const updateCustomerSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  phone: z.string().regex(phoneRegex, 'Invalid Indian mobile number').optional().or(z.literal('')),
  company: z.string().optional(),
  address: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

const queryCustomerSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  assignedTo: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), { message: 'Invalid ID format' }).optional(),
  createdFrom: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date' }).optional(),
  createdTo: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date' }).optional(),
  sortBy: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
});

module.exports = {
  createCustomerSchema,
  updateCustomerSchema,
  queryCustomerSchema,
};
