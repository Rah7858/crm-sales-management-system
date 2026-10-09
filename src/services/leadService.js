const Lead = require('../models/Lead');
const User = require('../models/User');
const Activity = require('../models/Activity');
const AppError = require('../utils/AppError');
const { logEvent } = require('./timelineService');
const { canAccessRecord, getTeamUserIds } = require('../utils/accessControl');
const mongoose = require('mongoose');

const createLead = async (data, user) => {
  let assignedTo = user._id;

  if (user.role === 'admin' || user.role === 'sales_manager') {
    if (data.assignedTo) {
      const assignee = await User.findOne({ _id: data.assignedTo, role: 'sales_executive', isActive: true });
      if (!assignee) {
        throw new AppError('Assignee must be an active sales executive', 400);
      }
      
      if (user.role === 'sales_manager') {
        const teamIds = await getTeamUserIds(user._id);
        if (!teamIds.some((id) => id.toString() === data.assignedTo) && data.assignedTo !== user._id.toString()) {
          throw new AppError('Manager can only assign leads to their own team members', 403);
        }
      }
      assignedTo = data.assignedTo;
    }
  }

  const lead = await Lead.create({
    ...data,
    assignedTo,
    createdBy: user._id,
  });

  await logEvent({
    action: 'lead_created',
    entityType: 'lead',
    entityId: lead._id,
    performedBy: user._id,
  });

  return lead;
};

const updateLead = async (id, data, user) => {
  const lead = await Lead.findById(id);
  if (!lead) throw new AppError('Lead not found', 404);

  const hasAccess = await canAccessRecord(user, lead);
  if (!hasAccess) throw new AppError('You do not have permission to access this lead', 403);

  if (lead.isConverted) throw new AppError('Converted leads cannot be edited', 400);

  const previousPriority = lead.priority;

  Object.assign(lead, data);
  await lead.save();

  if (data.priority && previousPriority !== data.priority) {
    await logEvent({
      action: 'lead_priority_changed',
      entityType: 'lead',
      entityId: lead._id,
      performedBy: user._id,
      previousValue: previousPriority,
      newValue: data.priority,
    });
  }

  return lead;
};

const updateLeadStatus = async (id, newStatus, user) => {
  const lead = await Lead.findById(id);
  if (!lead) throw new AppError('Lead not found', 404);

  const hasAccess = await canAccessRecord(user, lead);
  if (!hasAccess) throw new AppError('You do not have permission to access this lead', 403);

  const oldStatus = lead.status;
  
  if (lead.isConverted || ['unqualified', 'lost', 'converted'].includes(oldStatus)) {
    throw new AppError(`Cannot change status from ${oldStatus}`, 400);
  }

  const validTransitions = {
    new: ['contacted', 'unqualified', 'lost'],
    contacted: ['qualified', 'unqualified', 'lost'],
    qualified: ['lost'],
  };

  if (newStatus === 'converted') {
    throw new AppError('Cannot set converted status here. Use the conversion endpoint.', 400);
  }

  if (!validTransitions[oldStatus] || !validTransitions[oldStatus].includes(newStatus)) {
    throw new AppError(`Invalid status transition from ${oldStatus} to ${newStatus}`, 400);
  }

  lead.status = newStatus;
  await lead.save();

  await logEvent({
    action: 'lead_status_changed',
    entityType: 'lead',
    entityId: lead._id,
    performedBy: user._id,
    previousValue: oldStatus,
    newValue: newStatus,
  });

  return lead;
};

const assignLead = async (id, newAssigneeId, user) => {
  const lead = await Lead.findById(id);
  if (!lead) throw new AppError('Lead not found', 404);

  if (lead.isConverted) throw new AppError('Converted leads cannot be reassigned', 400);

  const hasAccess = await canAccessRecord(user, lead);
  if (!hasAccess) throw new AppError('You do not have permission to access this lead', 403);

  const assignee = await User.findOne({ _id: newAssigneeId, role: 'sales_executive', isActive: true });
  if (!assignee) throw new AppError('Assignee must be an active sales executive', 400);

  if (user.role === 'sales_manager') {
    const teamIds = await getTeamUserIds(user._id);
    if (!teamIds.some((uid) => uid.toString() === newAssigneeId) && newAssigneeId !== user._id.toString()) {
      throw new AppError('Manager can only assign leads to their own team members', 403);
    }
  }

  const previousAssigneeId = lead.assignedTo;
  lead.assignedTo = newAssigneeId;
  await lead.save();

  const action = previousAssigneeId ? 'lead_reassigned' : 'lead_assigned';
  await logEvent({
    action,
    entityType: 'lead',
    entityId: lead._id,
    performedBy: user._id,
    previousValue: previousAssigneeId,
    newValue: newAssigneeId,
  });

  return lead;
};

const deleteLead = async (id, user) => {
  const lead = await Lead.findById(id);
  if (!lead) throw new AppError('Lead not found', 404);

  if (lead.isConverted) throw new AppError('Converted leads cannot be deleted', 400);

  await Lead.findByIdAndDelete(id);
};

const addNoteToLead = async (id, text, user) => {
  const lead = await Lead.findById(id);
  if (!lead) throw new AppError('Lead not found', 404);

  const hasAccess = await canAccessRecord(user, lead);
  if (!hasAccess) throw new AppError('You do not have permission to access this lead', 403);

  const activity = await Activity.create({
    type: 'note',
    title: `Note for Lead: ${lead.name}`,
    description: text,
    assignedTo: user._id,
    status: 'completed',
    completedAt: new Date(),
    createdBy: user._id,
    relatedTo: {
      entityType: 'lead',
      entityId: lead._id,
    },
  });

  await logEvent({
    action: 'lead_note_added',
    entityType: 'lead',
    entityId: lead._id,
    performedBy: user._id,
    note: text,
  });

  return activity;
};

module.exports = {
  createLead,
  updateLead,
  updateLeadStatus,
  assignLead,
  deleteLead,
  addNoteToLead,
};
