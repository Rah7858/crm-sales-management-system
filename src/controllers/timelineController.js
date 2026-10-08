const Timeline = require('../models/Timeline');
const Lead = require('../models/Lead');
const Customer = require('../models/Customer');
const Deal = require('../models/Deal');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const sendResponse = require('../utils/sendResponse');
const getPagination = require('../utils/pagination');
const { canAccessRecord } = require('../utils/accessControl');

const getTimeline = asyncHandler(async (req, res, next) => {
  const { entityType, entityId } = req.params;
  const { skip, limit, buildMeta } = getPagination(req.query);

  let Model;
  if (entityType === 'lead') Model = Lead;
  else if (entityType === 'customer') Model = Customer;
  else if (entityType === 'deal') Model = Deal;
  else return next(new AppError('Invalid entity type', 400));

  const entity = await Model.findById(entityId);
  if (!entity) {
    return next(new AppError(`${entityType} not found`, 404));
  }

  const hasAccess = await canAccessRecord(req.user, entity);
  if (!hasAccess) {
    return next(new AppError('You do not have permission to view this timeline', 403));
  }

  const query = { entityType, entityId };
  
  const [timeline, totalRecords] = await Promise.all([
    Timeline.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('performedBy', 'name role'),
    Timeline.countDocuments(query),
  ]);

  sendResponse(res, 200, 'Timeline fetched successfully', {
    timeline,
    meta: buildMeta(totalRecords),
  });
});

module.exports = {
  getTimeline,
};
