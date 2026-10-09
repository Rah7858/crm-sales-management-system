const express = require('express');
const {
  createActivity,
  getActivities,
  getActivity,
  updateActivity,
  completeActivity,
  deleteActivity,
} = require('../controllers/activityController');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { createActivitySchema, updateActivitySchema, queryActivitySchema } = require('../validators/activityValidator');
const { objectIdSchema } = require('../validators/authValidator');

const router = express.Router();

router.use(authenticate);

router.post('/', validate(createActivitySchema), createActivity);
router.get('/', validate(queryActivitySchema, 'query'), getActivities);
router.get('/:id', validate(objectIdSchema, 'params'), getActivity);
router.put('/:id', validate(objectIdSchema, 'params'), validate(updateActivitySchema), updateActivity);
router.patch('/:id/complete', validate(objectIdSchema, 'params'), completeActivity);
router.delete('/:id', validate(objectIdSchema, 'params'), deleteActivity);

module.exports = router;
