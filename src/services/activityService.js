const Activity = require('../models/Activity');
const Lead = require('../models/Lead');
const Customer = require('../models/Customer');
const Deal = require('../models/Deal');
const User = require('../models/User');
const { logEvent } = require('./timelineService');
const { canAccessRecord, getAccessFilter, getTeamUserIds } = require('../utils/accessControl');
const AppError = require('../utils/AppError');

const verifyEntityAccess = async (entityType, entityId, user) => {
  let record;
  if (entityType === 'lead') record = await Lead.findById(entityId);
  else if (entityType === 'customer') record = await Customer.findById(entityId);
  else if (entityType === 'deal') record = await Deal.findById(entityId);
  else if (entityType === 'user') record = await User.findById(entityId);

  if (!record) throw new AppError(`${entityType} not found`, 404);

  if (entityType !== 'user') {
    const hasAccess = await canAccessRecord(user, record);
    if (!hasAccess) throw new AppError(`You do not have permission to access this ${entityType}`, 403);
  }
  return record;
};

const attachOverdue = (act) => {
  const doc = act.toObject ? act.toObject() : { ...act };
  if (doc.status === 'pending' && doc.dueDate && new Date(doc.dueDate) < new Date()) {
    doc.calculatedStatus = 'overdue';
    doc.isOverdue = true;
  } else {
    doc.calculatedStatus = doc.status;
    doc.isOverdue = false;
  }
  return doc;
};

const createActivity = async (data, user) => {
  await verifyEntityAccess(data.relatedTo.entityType, data.relatedTo.entityId, user);

  let assignedTo = user._id;

  if (data.assignedTo) {
    if (user.role === 'admin' || user.role === 'sales_manager') {
      const assignee = await User.findOne({ _id: data.assignedTo, role: 'sales_executive', isActive: true });
      if (!assignee) throw new AppError('Assignee must be an active sales executive', 400);

      if (user.role === 'sales_manager') {
        const teamIds = await getTeamUserIds(user._id);
        if (!teamIds.some((id) => id.toString() === data.assignedTo) && data.assignedTo !== user._id.toString()) {
          throw new AppError('Manager can only assign activities to their team members', 403);
        }
      }
      assignedTo = data.assignedTo;
    } else if (data.assignedTo !== user._id.toString()) {
      throw new AppError('Executives can only assign activities to themselves', 403);
    }
  }

  const activity = await Activity.create({
    type: data.type,
    title: data.title,
    description: data.description,
    dueDate: data.dueDate,
    status: data.status || 'pending',
    assignedTo,
    createdBy: user._id,
    relatedTo: {
      entityType: data.relatedTo.entityType,
      entityId: data.relatedTo.entityId,
    },
  });

  if (data.type === 'follow_up') {
    await logEvent({
      action: 'follow_up_created',
      entityType: data.relatedTo.entityType,
      entityId: data.relatedTo.entityId,
      performedBy: user._id,
      note: data.title,
    });
  }

  return attachOverdue(activity);
};

const updateActivity = async (id, data, user) => {
  const activity = await Activity.findById(id);
  if (!activity) throw new AppError('Activity not found', 404);

  // Check access to existing activity entity
  await verifyEntityAccess(activity.relatedTo.entityType, activity.relatedTo.entityId, user);

  if (data.assignedTo && data.assignedTo !== activity.assignedTo.toString()) {
    if (user.role === 'admin' || user.role === 'sales_manager') {
      const assignee = await User.findOne({ _id: data.assignedTo, role: 'sales_executive', isActive: true });
      if (!assignee) throw new AppError('Assignee must be an active sales executive', 400);

      if (user.role === 'sales_manager') {
        const teamIds = await getTeamUserIds(user._id);
        if (!teamIds.some((uid) => uid.toString() === data.assignedTo) && data.assignedTo !== user._id.toString()) {
          throw new AppError('Manager can only assign to their team members', 403);
        }
      }
    } else {
      throw new AppError('Executives cannot reassign activities to others', 403);
    }
  }

  Object.assign(activity, data);
  await activity.save();

  return attachOverdue(activity);
};

const completeActivity = async (id, user) => {
  const activity = await Activity.findById(id);
  if (!activity) throw new AppError('Activity not found', 404);

  await verifyEntityAccess(activity.relatedTo.entityType, activity.relatedTo.entityId, user);

  if (activity.status === 'completed') {
    throw new AppError('Activity is already completed', 400);
  }

  activity.status = 'completed';
  activity.completedAt = new Date();
  await activity.save();

  if (activity.type === 'follow_up') {
    await logEvent({
      action: 'follow_up_completed',
      entityType: activity.relatedTo.entityType,
      entityId: activity.relatedTo.entityId,
      performedBy: user._id,
      note: activity.title,
    });
  }

  return attachOverdue(activity);
};

const deleteActivity = async (id, user) => {
  const activity = await Activity.findById(id);
  if (!activity) throw new AppError('Activity not found', 404);

  if (user.role !== 'admin') {
    if (user.role === 'sales_manager') {
      const teamIds = await getTeamUserIds(user._id);
      if (activity.createdBy.toString() !== user._id.toString() && !teamIds.some(uid => uid.toString() === activity.createdBy.toString())) {
         throw new AppError('You can only delete activities created by your team', 403);
      }
    } else {
      if (activity.createdBy.toString() !== user._id.toString()) {
        throw new AppError('You can only delete your own activities', 403);
      }
    }
  }

  await Activity.findByIdAndDelete(id);
};

module.exports = {
  createActivity,
  updateActivity,
  completeActivity,
  deleteActivity,
  attachOverdue,
};
