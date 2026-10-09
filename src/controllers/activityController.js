const activityService = require('../services/activityService');
const Activity = require('../models/Activity');
const asyncHandler = require('../utils/asyncHandler');
const sendResponse = require('../utils/sendResponse');
const getPagination = require('../utils/pagination');
const { getAccessFilter, canAccessRecord } = require('../utils/accessControl');
const AppError = require('../utils/AppError');

const createActivity = asyncHandler(async (req, res, next) => {
  const activity = await activityService.createActivity(req.body, req.user);
  sendResponse(res, 201, 'Activity created successfully', { activity });
});

const getActivities = asyncHandler(async (req, res, next) => {
  const { type, status, assignedTo, entityType, entityId, dueFrom, dueTo, sortBy, order } = req.query;
  const { skip, limit, buildMeta } = getPagination(req.query);

  const accessFilter = await getAccessFilter(req.user);
  const query = { ...accessFilter }; // Assumes Activity has assignedTo field directly

  if (type) query.type = type;
  if (assignedTo) query.assignedTo = assignedTo;
  if (entityType) query['relatedTo.entityType'] = entityType;
  if (entityId) query['relatedTo.entityId'] = entityId;
  if (dueFrom || dueTo) {
    query.dueDate = {};
    if (dueFrom) query.dueDate.$gte = new Date(dueFrom);
    if (dueTo) query.dueDate.$lte = new Date(dueTo);
  }

  if (status === 'overdue') {
    query.status = 'pending';
    query.dueDate = query.dueDate || {};
    query.dueDate.$lt = new Date();
  } else if (status) {
    query.status = status;
  }

  let sortOptions = { createdAt: -1 };
  if (sortBy) {
    sortOptions = {};
    sortOptions[sortBy] = order === 'asc' ? 1 : -1;
  }

  const [activities, totalRecords] = await Promise.all([
    Activity.find(query).sort(sortOptions).skip(skip).limit(limit).populate('assignedTo', 'name email'),
    Activity.countDocuments(query),
  ]);

  const mappedActivities = activities.map(activityService.attachOverdue);

  sendResponse(res, 200, 'Activities fetched successfully', {
    activities: mappedActivities,
    meta: buildMeta(totalRecords),
  });
});

const getActivity = asyncHandler(async (req, res, next) => {
  const activity = await Activity.findById(req.params.id).populate('assignedTo', 'name email');
  if (!activity) return next(new AppError('Activity not found', 404));

  // The rules state we check the related entity to see if we have access.
  // Wait, if it's assigned to the executive but on a lead they don't own? 
  // It's safer to check access on the entity or the activity itself.
  // The service verifies entity access. Let's do a lightweight check:
  // Activity has assignedTo. Our getAccessFilter applies to `assignedTo`.
  const hasAccess = await canAccessRecord(req.user, activity);
  if (!hasAccess) return next(new AppError('You do not have permission to access this activity', 403));

  sendResponse(res, 200, 'Activity fetched successfully', {
    activity: activityService.attachOverdue(activity),
  });
});

const updateActivity = asyncHandler(async (req, res, next) => {
  const activity = await activityService.updateActivity(req.params.id, req.body, req.user);
  sendResponse(res, 200, 'Activity updated successfully', { activity });
});

const completeActivity = asyncHandler(async (req, res, next) => {
  const activity = await activityService.completeActivity(req.params.id, req.user);
  sendResponse(res, 200, 'Activity completed successfully', { activity });
});

const deleteActivity = asyncHandler(async (req, res, next) => {
  await activityService.deleteActivity(req.params.id, req.user);
  sendResponse(res, 200, 'Activity deleted successfully');
});

module.exports = {
  createActivity,
  getActivities,
  getActivity,
  updateActivity,
  completeActivity,
  deleteActivity,
};
