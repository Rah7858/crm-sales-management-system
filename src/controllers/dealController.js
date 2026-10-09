const dealService = require('../services/dealService');
const Deal = require('../models/Deal');
const asyncHandler = require('../utils/asyncHandler');
const sendResponse = require('../utils/sendResponse');
const getPagination = require('../utils/pagination');
const { getAccessFilter, canAccessRecord } = require('../utils/accessControl');
const AppError = require('../utils/AppError');

const createDeal = asyncHandler(async (req, res, next) => {
  const deal = await dealService.createDeal(req.body, req.user);
  sendResponse(res, 201, 'Deal created successfully', { deal });
});

const getDeals = asyncHandler(async (req, res, next) => {
  const { search, stage, assignedTo, minAmount, maxAmount, closingFrom, closingTo, status, sortBy, order } = req.query;
  const { skip, limit, buildMeta } = getPagination(req.query);

  const accessFilter = await getAccessFilter(req.user);
  const query = { ...accessFilter };

  if (search) {
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchRegex = new RegExp(escapedSearch, 'i');
    query.name = searchRegex;
  }

  if (stage) query.stage = stage;
  if (assignedTo) query.assignedTo = assignedTo;

  if (minAmount || maxAmount) {
    query.value = {};
    if (minAmount) query.value.$gte = Number(minAmount);
    if (maxAmount) query.value.$lte = Number(maxAmount);
  }

  if (closingFrom || closingTo) {
    query.expectedClosingDate = {};
    if (closingFrom) query.expectedClosingDate.$gte = new Date(closingFrom);
    if (closingTo) query.expectedClosingDate.$lte = new Date(closingTo);
  }

  if (status === 'open') {
    query.stage = { $nin: ['won', 'lost'] };
  } else if (status === 'closed') {
    query.stage = { $in: ['won', 'lost'] };
  }

  let sortOptions = { createdAt: -1 };
  if (sortBy) {
    sortOptions = {};
    sortOptions[sortBy] = order === 'asc' ? 1 : -1;
  }

  const [deals, totalRecords] = await Promise.all([
    Deal.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .populate('assignedTo', 'name email')
      .populate('lead', 'name company')
      .populate('customer', 'name company'),
    Deal.countDocuments(query),
  ]);

  sendResponse(res, 200, 'Deals fetched successfully', {
    deals,
    meta: buildMeta(totalRecords),
  });
});

const getDeal = asyncHandler(async (req, res, next) => {
  const deal = await Deal.findById(req.params.id)
    .populate('assignedTo', 'name email')
    .populate('lead', 'name company')
    .populate('customer', 'name company');

  if (!deal) return next(new AppError('Deal not found', 404));

  const hasAccess = await canAccessRecord(req.user, deal);
  if (!hasAccess) return next(new AppError('You do not have permission to access this deal', 403));

  sendResponse(res, 200, 'Deal fetched successfully', { deal });
});

const updateDeal = asyncHandler(async (req, res, next) => {
  const deal = await dealService.updateDeal(req.params.id, req.body, req.user);
  sendResponse(res, 200, 'Deal updated successfully', { deal });
});

const changeDealStage = asyncHandler(async (req, res, next) => {
  const deal = await dealService.changeDealStage(req.params.id, req.body, req.user);
  sendResponse(res, 200, 'Deal stage updated successfully', { deal });
});

const assignDeal = asyncHandler(async (req, res, next) => {
  const deal = await dealService.assignDeal(req.params.id, req.body.assignedTo, req.user);
  sendResponse(res, 200, 'Deal assigned successfully', { deal });
});

const deleteDeal = asyncHandler(async (req, res, next) => {
  await dealService.deleteDeal(req.params.id, req.user);
  sendResponse(res, 200, 'Deal deleted successfully');
});

module.exports = {
  createDeal,
  getDeals,
  getDeal,
  updateDeal,
  changeDealStage,
  assignDeal,
  deleteDeal,
};
