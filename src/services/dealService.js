const Deal = require('../models/Deal');
const Lead = require('../models/Lead');
const Customer = require('../models/Customer');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { logEvent } = require('./timelineService');
const { canAccessRecord, getTeamUserIds } = require('../utils/accessControl');

const createDeal = async (data, user) => {
  if (data.expectedRevenue !== undefined) {
    throw new AppError('Client cannot provide expectedRevenue', 400);
  }

  const lead = await Lead.findById(data.lead);
  if (!lead) throw new AppError('Lead not found', 404);

  const customer = await Customer.findById(data.customer);
  if (!customer) throw new AppError('Customer not found', 404);

  if (customer.lead && customer.lead.toString() !== data.lead) {
    throw new AppError('Customer and Lead do not match appropriately', 400);
  }

  let assignedTo = user._id;

  if (user.role === 'admin' || user.role === 'sales_manager') {
    if (data.assignedTo) {
      const assignee = await User.findOne({ _id: data.assignedTo, role: 'sales_executive', isActive: true });
      if (!assignee) throw new AppError('Assignee must be an active sales executive', 400);

      if (user.role === 'sales_manager') {
        const teamIds = await getTeamUserIds(user._id);
        if (!teamIds.some((id) => id.toString() === data.assignedTo) && data.assignedTo !== user._id.toString()) {
          throw new AppError('Manager can only assign deals to their own team members', 403);
        }
      }
      assignedTo = data.assignedTo;
    }
  }

  const expectedRevenue = (data.value * data.probability) / 100;

  const deal = await Deal.create({
    ...data,
    expectedRevenue,
    assignedTo,
    createdBy: user._id,
  });

  await logEvent({
    action: 'deal_created',
    entityType: 'deal',
    entityId: deal._id,
    performedBy: user._id,
  });

  return deal;
};

const updateDeal = async (id, data, user) => {
  if (data.expectedRevenue !== undefined) {
    throw new AppError('Client cannot provide expectedRevenue', 400);
  }

  if (data.stage !== undefined) {
    await changeDealStage(id, { stage: data.stage, lostReason: data.lostReason }, user);
    delete data.stage;
    delete data.lostReason;
  }

  if (Object.keys(data).length === 0) {
    return await Deal.findById(id);
  }

  const deal = await Deal.findById(id);
  if (!deal) throw new AppError('Deal not found', 404);

  const hasAccess = await canAccessRecord(user, deal);
  if (!hasAccess) throw new AppError('You do not have permission to access this deal', 403);

  Object.assign(deal, data);

  if (data.value !== undefined || data.probability !== undefined) {
    deal.expectedRevenue = (deal.value * deal.probability) / 100;
  }

  await deal.save();

  await logEvent({
    action: 'deal_updated',
    entityType: 'deal',
    entityId: deal._id,
    performedBy: user._id,
  });

  return deal;
};

const changeDealStage = async (id, data, user) => {
  const { stage, lostReason } = data;
  const deal = await Deal.findById(id);
  if (!deal) throw new AppError('Deal not found', 404);

  const hasAccess = await canAccessRecord(user, deal);
  if (!hasAccess) throw new AppError('You do not have permission to access this deal', 403);

  const oldStage = deal.stage;

  if (oldStage === 'won' || oldStage === 'lost') {
    throw new AppError(`A ${oldStage} deal cannot move back to an active stage`, 400);
  }

  if (stage === 'lost' && (!lostReason || lostReason.trim() === '')) {
    throw new AppError('A reason is required when a deal is lost', 400);
  }

  if (stage === 'won') {
    if (!deal.customer) throw new AppError('A won deal must have a valid customer', 400);
    if (deal.value <= 0) throw new AppError('A won deal must have a value greater than 0', 400);
  }

  deal.stage = stage;
  if (stage === 'lost') {
    deal.lostReason = lostReason;
  }

  await deal.save();

  await logEvent({
    action: 'deal_stage_changed',
    entityType: 'deal',
    entityId: deal._id,
    performedBy: user._id,
    previousValue: oldStage,
    newValue: stage,
  });

  if (stage === 'won') {
    await logEvent({
      action: 'deal_won',
      entityType: 'deal',
      entityId: deal._id,
      performedBy: user._id,
    });
  } else if (stage === 'lost') {
    await logEvent({
      action: 'deal_lost',
      entityType: 'deal',
      entityId: deal._id,
      performedBy: user._id,
      note: lostReason,
    });
  }

  return deal;
};

const assignDeal = async (id, newAssigneeId, user) => {
  const deal = await Deal.findById(id);
  if (!deal) throw new AppError('Deal not found', 404);

  const assignee = await User.findOne({ _id: newAssigneeId, role: 'sales_executive', isActive: true });
  if (!assignee) throw new AppError('Assignee must be an active sales executive', 400);

  if (user.role === 'sales_manager') {
    const teamIds = await getTeamUserIds(user._id);
    if (!teamIds.some((uid) => uid.toString() === newAssigneeId) && newAssigneeId !== user._id.toString()) {
      throw new AppError('Manager can only assign deals to their own team members', 403);
    }
  }

  const previousAssigneeId = deal.assignedTo;
  deal.assignedTo = newAssigneeId;
  await deal.save();

  await logEvent({
    action: 'deal_assigned',
    entityType: 'deal',
    entityId: deal._id,
    performedBy: user._id,
    previousValue: previousAssigneeId,
    newValue: newAssigneeId,
  });

  return deal;
};

const deleteDeal = async (id, user) => {
  const deal = await Deal.findById(id);
  if (!deal) throw new AppError('Deal not found', 404);

  await Deal.findByIdAndDelete(id);

  // In this design, logging deletion requires carefully checking if timeline objects survive. 
  // It's usually fine to log it even if the entity is gone.
  await logEvent({
    action: 'deal_deleted',
    entityType: 'deal',
    entityId: deal._id,
    performedBy: user._id,
  });
};

module.exports = {
  createDeal,
  updateDeal,
  changeDealStage,
  assignDeal,
  deleteDeal,
};
