const express = require('express');
const { getTimeline } = require('../controllers/timelineController');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { z } = require('zod');
const mongoose = require('mongoose');

const router = express.Router();

const timelineParamsSchema = z.object({
  entityType: z.enum(['lead', 'customer', 'deal']),
  entityId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: 'Invalid ID format',
  }),
});

router.use(authenticate);

router.get('/:entityType/:entityId', validate(timelineParamsSchema, 'params'), getTimeline);

module.exports = router;
