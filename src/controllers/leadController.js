const leadService = require('../services/leadService');
const Lead = require('../models/Lead');
const Activity = require('../models/Activity');
const asyncHandler = require('../utils/asyncHandler');
const sendResponse = require('../utils/sendResponse');
const getPagination = require('../utils/pagination');
const { getAccessFilter, canAccessRecord } = require('../utils/accessControl');
const AppError = require('../utils/AppError');

const createLead = asyncHandler(async (req, res, next) => {
  const lead = await leadService.createLead(req.body, req.user);
  sendResponse(res, 201, 'Lead created successfully', { lead });
});

const getLeads = asyncHandler(async (req, res, next) => {
  const { search, status, priority, source, assignedTo, createdFrom, createdTo, sortBy, order } = req.query;
  const { skip, limit, buildMeta } = getPagination(req.query);

  const accessFilter = await getAccessFilter(req.user);
  const query = { ...accessFilter };

  if (search) {
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchRegex = new RegExp(escapedSearch, 'i');
    query.$or = [{ name: searchRegex }, { email: searchRegex }, { company: searchRegex }];
  }

  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (source) query.source = source;
  if (assignedTo) query.assignedTo = assignedTo;

  if (createdFrom || createdTo) {
    query.createdAt = {};
    if (createdFrom) query.createdAt.$gte = new Date(createdFrom);
    if (createdTo) query.createdAt.$lte = new Date(createdTo);
  }

  let sortOptions = { createdAt: -1 };
  if (sortBy) {
    sortOptions = {};
    sortOptions[sortBy] = order === 'asc' ? 1 : -1;
  }

  const [leads, totalRecords] = await Promise.all([
    Lead.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .populate('assignedTo', 'name email'),
    Lead.countDocuments(query),
  ]);

  sendResponse(res, 200, 'Leads fetched successfully', {
    leads,
    meta: buildMeta(totalRecords),
  });
});

const getLead = asyncHandler(async (req, res, next) => {
  console.log(
    `[DIAGNOSTIC] req.params.id: "${req.params.id}" | length: ${req.params.id.length} | hex: ${Buffer.from(req.params.id).toString('hex')}`
  );
  const lead = await Lead.findById(req.params.id).populate('assignedTo', 'name email');
  if (!lead) return next(new AppError('Lead not found', 404));

  const hasAccess = await canAccessRecord(req.user, lead);
  if (!hasAccess) return next(new AppError('You do not have permission to access this lead', 403));

  sendResponse(res, 200, 'Lead fetched successfully', { lead });
});

const updateLead = asyncHandler(async (req, res, next) => {
  const lead = await leadService.updateLead(req.params.id, req.body, req.user);
  sendResponse(res, 200, 'Lead updated successfully', { lead });
});

const updateLeadStatus = asyncHandler(async (req, res, next) => {
  const lead = await leadService.updateLeadStatus(req.params.id, req.body.status, req.user);
  sendResponse(res, 200, 'Lead status updated successfully', { lead });
});

const assignLead = asyncHandler(async (req, res, next) => {
  const lead = await leadService.assignLead(req.params.id, req.body.assignedTo, req.user);
  sendResponse(res, 200, 'Lead assigned successfully', { lead });
});

const deleteLead = asyncHandler(async (req, res, next) => {
  await leadService.deleteLead(req.params.id, req.user);
  sendResponse(res, 200, 'Lead deleted successfully');
});

const addNoteToLead = asyncHandler(async (req, res, next) => {
  const activity = await leadService.addNoteToLead(req.params.id, req.body.text, req.user);
  sendResponse(res, 201, 'Note added successfully', { activity });
});

const getLeadNotes = asyncHandler(async (req, res, next) => {
  const lead = await Lead.findById(req.params.id);
  if (!lead) return next(new AppError('Lead not found', 404));

  const hasAccess = await canAccessRecord(req.user, lead);
  if (!hasAccess) return next(new AppError('You do not have permission to access this lead', 403));

  const { skip, limit, buildMeta } = getPagination(req.query);

  const query = {
    type: 'note',
    'relatedTo.entityType': 'lead',
    'relatedTo.entityId': lead._id,
  };

  const [notes, totalRecords] = await Promise.all([
    Activity.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Activity.countDocuments(query),
  ]);

  sendResponse(res, 200, 'Notes fetched successfully', {
    notes,
    meta: buildMeta(totalRecords),
  });
});

module.exports = {
  createLead,
  getLeads,
  getLead,
  updateLead,
  updateLeadStatus,
  assignLead,
  deleteLead,
  addNoteToLead,
  getLeadNotes,
};
