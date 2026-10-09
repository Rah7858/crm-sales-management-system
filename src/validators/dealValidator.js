const { z } = require('zod');
const mongoose = require('mongoose');

const objectIdRefine = (val) => mongoose.Types.ObjectId.isValid(val);

const createDealSchema = z.object({
  name: z.string().min(2, 'Deal name is required'),
  lead: z.string().refine(objectIdRefine, 'Invalid lead ID'),
  customer: z.string().refine(objectIdRefine, 'Invalid customer ID'),
  value: z.number().positive('Value must be greater than 0'),
  probability: z.number().min(0).max(100, 'Probability must be between 0 and 100'),
  expectedClosingDate: z.string().refine((val) => {
    const date = new Date(val);
    return !isNaN(date.getTime()) && date >= new Date(new Date().setHours(0, 0, 0, 0));
  }, { message: 'Invalid or past date' }),
  stage: z.enum(['qualification', 'discovery', 'proposal', 'negotiation', 'won', 'lost']).optional(),
  description: z.string().optional(),
  assignedTo: z.string().refine(objectIdRefine, 'Invalid assignee ID').optional(),
}).strict().refine((data) => !('expectedRevenue' in data), {
  message: 'Client cannot provide expectedRevenue',
});

const updateDealSchema = z.object({
  name: z.string().min(2).optional(),
  value: z.number().positive('Value must be greater than 0').optional(),
  probability: z.number().min(0).max(100).optional(),
  expectedClosingDate: z.string().refine((val) => {
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, { message: 'Invalid date' }).optional(),
  description: z.string().optional(),
  stage: z.enum(['qualification', 'discovery', 'proposal', 'negotiation', 'won', 'lost']).optional(),
  lostReason: z.string().optional(),
}).strict().refine((data) => !('expectedRevenue' in data), {
  message: 'Client cannot provide expectedRevenue',
});

const stageDealSchema = z.object({
  stage: z.enum(['qualification', 'discovery', 'proposal', 'negotiation', 'won', 'lost']),
  lostReason: z.string().optional(),
});

const assignDealSchema = z.object({
  assignedTo: z.string().refine(objectIdRefine, { message: 'Invalid assignee ID' }),
});

const queryDealSchema = z.object({
  search: z.string().optional(),
  stage: z.enum(['qualification', 'discovery', 'proposal', 'negotiation', 'won', 'lost']).optional(),
  assignedTo: z.string().refine(objectIdRefine).optional(),
  minAmount: z.string().regex(/^\d+(\.\d+)?$/).optional(),
  maxAmount: z.string().regex(/^\d+(\.\d+)?$/).optional(),
  closingFrom: z.string().refine((val) => !isNaN(Date.parse(val))).optional(),
  closingTo: z.string().refine((val) => !isNaN(Date.parse(val))).optional(),
  status: z.enum(['open', 'closed']).optional(),
  sortBy: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
});

module.exports = {
  createDealSchema,
  updateDealSchema,
  stageDealSchema,
  assignDealSchema,
  queryDealSchema,
};
