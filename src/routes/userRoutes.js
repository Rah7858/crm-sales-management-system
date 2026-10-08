const express = require('express');
const {
  createUser,
  getUsers,
  getUser,
  updateUser,
  updateUserStatus,
  deleteUser,
} = require('../controllers/userController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { createUserSchema, updateUserSchema } = require('../validators/userValidator');
const { objectIdSchema } = require('../validators/authValidator');

const router = express.Router();

router.use(authenticate);
router.use(authorize('admin'));

router.post('/', validate(createUserSchema), createUser);
router.get('/', getUsers);
router.get('/:id', validate(objectIdSchema, 'params'), getUser);
router.put('/:id', validate(objectIdSchema, 'params'), validate(updateUserSchema), updateUser);
router.patch('/:id/status', validate(objectIdSchema, 'params'), updateUserStatus);
router.delete('/:id', validate(objectIdSchema, 'params'), deleteUser);

module.exports = router;
