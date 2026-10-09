const customerService = require('../services/customerService');
const Customer = require('../models/Customer');
const Deal = require('../models/Deal');
const asyncHandler = require('../utils/asyncHandler');
const sendResponse = require('../utils/sendResponse');
const getPagination = require('../utils/pagination');
const { getAccessFilter, canAccessRecord } = require('../utils/accessControl');
const AppError = require('../utils/AppError');

const createCustomer = asyncHandler(async (req, res, next) => {
  const customer = await customerService.createCustomer(req.body, req.user);
  sendResponse(res, 201, 'Customer created successfully', { customer });
});

const getCustomers = asyncHandler(async (req, res, next) => {
  const { search, status, assignedTo, createdFrom, createdTo, sortBy, order } = req.query;
  const { skip, limit, buildMeta } = getPagination(req.query);

  const accessFilter = await getAccessFilter(req.user);
  const query = { ...accessFilter };

  if (search) {
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchRegex = new RegExp(escapedSearch, 'i');
    query.$or = [{ name: searchRegex }, { email: searchRegex }, { company: searchRegex }];
  }

  if (status) query.status = status;
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

  const [customers, totalRecords] = await Promise.all([
    Customer.find(query).sort(sortOptions).skip(skip).limit(limit).populate('assignedTo', 'name email'),
    Customer.countDocuments(query),
  ]);

  sendResponse(res, 200, 'Customers fetched successfully', {
    customers,
    meta: buildMeta(totalRecords),
  });
});

const getCustomer = asyncHandler(async (req, res, next) => {
  const customer = await Customer.findById(req.params.id)
    .populate('assignedTo', 'name email')
    .populate('lead', 'name source');
    
  if (!customer) return next(new AppError('Customer not found', 404));

  const hasAccess = await canAccessRecord(req.user, customer);
  if (!hasAccess) return next(new AppError('You do not have permission to access this customer', 403));

  const deals = await Deal.find({ customer: customer._id }).populate('assignedTo', 'name email');

  sendResponse(res, 200, 'Customer fetched successfully', { customer, deals });
});

const updateCustomer = asyncHandler(async (req, res, next) => {
  const customer = await customerService.updateCustomer(req.params.id, req.body, req.user);
  sendResponse(res, 200, 'Customer updated successfully', { customer });
});

const deleteCustomer = asyncHandler(async (req, res, next) => {
  await customerService.deleteCustomer(req.params.id, req.user);
  sendResponse(res, 200, 'Customer deleted successfully');
});

module.exports = {
  createCustomer,
  getCustomers,
  getCustomer,
  updateCustomer,
  deleteCustomer,
};
