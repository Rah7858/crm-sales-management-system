const express = require('express');
const {
  createCustomer,
  getCustomers,
  getCustomer,
  updateCustomer,
  deleteCustomer,
} = require('../controllers/customerController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { createCustomerSchema, updateCustomerSchema, queryCustomerSchema } = require('../validators/customerValidator');
const { objectIdSchema } = require('../validators/authValidator');

const router = express.Router();

router.use(authenticate);

router.post('/', validate(createCustomerSchema), createCustomer);
router.get('/', validate(queryCustomerSchema, 'query'), getCustomers);
router.get('/:id', validate(objectIdSchema, 'params'), getCustomer);
router.put('/:id', validate(objectIdSchema, 'params'), validate(updateCustomerSchema), updateCustomer);
router.delete('/:id', authorize('admin'), validate(objectIdSchema, 'params'), deleteCustomer);

module.exports = router;
