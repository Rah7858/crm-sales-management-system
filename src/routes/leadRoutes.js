const express = require('express');
const {
  createLead,
  getLeads,
  getLead,
  updateLead,
  updateLeadStatus,
  assignLead,
  deleteLead,
  addNoteToLead,
  getLeadNotes,
} = require('../controllers/leadController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { convertLead } = require('../controllers/conversionController');
const {
  createLeadSchema,
  updateLeadSchema,
  statusLeadSchema,
  assignLeadSchema,
  noteLeadSchema,
  queryLeadSchema,
  convertLeadSchema,
} = require('../validators/leadValidator');
const { objectIdSchema } = require('../validators/authValidator');

const router = express.Router();

router.use(authenticate);

router.post('/:id/convert', validate(objectIdSchema, 'params'), validate(convertLeadSchema), convertLead);

router.post('/', validate(createLeadSchema), createLead);
router.get('/', validate(queryLeadSchema, 'query'), getLeads);
router.get(
  '/:id',
  (req, res, next) => {
    console.log(
      `[DIAGNOSTIC-ROUTE] method=${req.method} originalUrl="${req.originalUrl}" paramsId="${req.params.id}" length=${req.params.id ? req.params.id.length : 'undefined'}`
    );
    next();
  },
  validate(objectIdSchema, 'params'),
  getLead
);
router.put('/:id', validate(objectIdSchema, 'params'), validate(updateLeadSchema), updateLead);
router.patch('/:id/status', validate(objectIdSchema, 'params'), validate(statusLeadSchema), updateLeadStatus);
router.patch('/:id/assign', authorize('admin', 'sales_manager'), validate(objectIdSchema, 'params'), validate(assignLeadSchema), assignLead);
router.delete('/:id', authorize('admin'), validate(objectIdSchema, 'params'), deleteLead);

router.post('/:id/notes', validate(objectIdSchema, 'params'), validate(noteLeadSchema), addNoteToLead);
router.get('/:id/notes', validate(objectIdSchema, 'params'), getLeadNotes);

module.exports = router;
