const express = require('express');
const {
  createDeal,
  getDeals,
  getDeal,
  updateDeal,
  changeDealStage,
  assignDeal,
  deleteDeal,
} = require('../controllers/dealController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const {
  createDealSchema,
  updateDealSchema,
  stageDealSchema,
  assignDealSchema,
  queryDealSchema,
} = require('../validators/dealValidator');
const { objectIdSchema } = require('../validators/authValidator');

const router = express.Router();

router.use(authenticate);

router.post('/', validate(createDealSchema), createDeal);
router.get('/', validate(queryDealSchema, 'query'), getDeals);
router.get('/:id', validate(objectIdSchema, 'params'), getDeal);
router.put('/:id', validate(objectIdSchema, 'params'), validate(updateDealSchema), updateDeal);
router.patch('/:id/stage', validate(objectIdSchema, 'params'), validate(stageDealSchema), changeDealStage);
router.patch('/:id/assign', authorize('admin', 'sales_manager'), validate(objectIdSchema, 'params'), validate(assignDealSchema), assignDeal);
router.delete('/:id', authorize('admin'), validate(objectIdSchema, 'params'), deleteDeal);

module.exports = router;
