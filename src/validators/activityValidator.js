const { z } = require('zod');
const mongoose = require('mongoose');

const objectIdRefine = (val) => mongoose.Types.ObjectId.isValid(val);

const createActivitySchema = z.object({
  type: z.enum(['call', 'email', 'meeting', 'demo', 'follow_up', 'reminder', 'note', 'task']),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date').optional(),
  status: z.enum(['pending', 'completed']).optional(),
  assignedTo: z.string().refine(objectIdRefine, 'Invalid assignee ID').optional(),
  relatedTo: z.object({
    entityType: z.enum(['lead', 'customer', 'deal', 'user']),
    entityId: z.string().refine(objectIdRefine, 'Invalid entity ID'),
  }),
}).strict();

const updateActivitySchema = z.object({
  type: z.enum(['call', 'email', 'meeting', 'demo', 'follow_up', 'reminder', 'note', 'task']).optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date').optional(),
  status: z.enum(['pending', 'completed']).optional(),
  assignedTo: z.string().refine(objectIdRefine, 'Invalid assignee ID').optional(),
  relatedTo: z.object({
    entityType: z.enum(['lead', 'customer', 'deal', 'user']),
    entityId: z.string().refine(objectIdRefine, 'Invalid entity ID'),
  }).optional(),
}).strict();

const queryActivitySchema = z.object({
  type: z.enum(['call', 'email', 'meeting', 'demo', 'follow_up', 'reminder', 'note', 'task']).optional(),
  status: z.enum(['pending', 'completed', 'overdue']).optional(),
  assignedTo: z.string().refine(objectIdRefine).optional(),
  entityType: z.enum(['lead', 'customer', 'deal', 'user']).optional(),
  entityId: z.string().refine(objectIdRefine).optional(),
  dueFrom: z.string().refine((val) => !isNaN(Date.parse(val))).optional(),
  dueTo: z.string().refine((val) => !isNaN(Date.parse(val))).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'dueDate', 'title', 'status']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
});

module.exports = {
  createActivitySchema,
  updateActivitySchema,
  queryActivitySchema,
};
