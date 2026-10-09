const { z } = require('zod');
const mongoose = require('mongoose');

const phoneRegex = /^(?:\+91|91)?[6-9]\d{9}$/;

const createLeadSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  phone: z.string().regex(phoneRegex, 'Invalid Indian mobile number').optional().or(z.literal('')),
  company: z.string().optional(),
  source: z.enum(['website', 'referral', 'social_media', 'email', 'phone', 'other']),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  description: z.string().optional(),
  assignedTo: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), { message: 'Invalid ID format' }).optional(),
});

const updateLeadSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  phone: z.string().regex(phoneRegex, 'Invalid Indian mobile number').optional().or(z.literal('')),
  company: z.string().optional(),
  source: z.enum(['website', 'referral', 'social_media', 'email', 'phone', 'other']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  description: z.string().optional(),
});

const statusLeadSchema = z.object({
  status: z.enum(['new', 'contacted', 'qualified', 'unqualified', 'converted', 'lost']),
});

const assignLeadSchema = z.object({
  assignedTo: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), { message: 'Invalid ID format' }),
});

const noteLeadSchema = z.object({
  text: z.string().min(1, 'Note text is required'),
});

const queryLeadSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'unqualified', 'converted', 'lost']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  source: z.enum(['website', 'referral', 'social_media', 'email', 'phone', 'other']).optional(),
  assignedTo: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), { message: 'Invalid ID' }).optional(),
  createdFrom: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date' }).optional(),
  createdTo: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date' }).optional(),
  sortBy: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
});

const convertLeadSchema = z.object({
  dealName: z.string().min(2, 'Deal name is required'),
  dealValue: z.number().positive('Deal value must be greater than 0'),
  probability: z.number().min(0).max(100, 'Probability must be between 0 and 100'),
  expectedClosingDate: z.string().refine((val) => {
    const date = new Date(val);
    return !isNaN(date.getTime()) && date >= new Date(new Date().setHours(0,0,0,0));
  }, { message: 'Invalid or past date' }),
  description: z.string().optional(),
});

module.exports = {
  createLeadSchema,
  updateLeadSchema,
  statusLeadSchema,
  assignLeadSchema,
  noteLeadSchema,
  queryLeadSchema,
  convertLeadSchema,
};
