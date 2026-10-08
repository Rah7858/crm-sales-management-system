const User = require('../models/User');
const Lead = require('../models/Lead');
const Customer = require('../models/Customer');
const Deal = require('../models/Deal');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const sendResponse = require('../utils/sendResponse');
const getPagination = require('../utils/pagination');

const createUser = asyncHandler(async (req, res, next) => {
  const { name, email, phone, password, role, isActive, manager } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError('Email already in use', 400));
  }

  if (role === 'sales_executive' && manager) {
    const managerUser = await User.findOne({ _id: manager, role: 'sales_manager', isActive: true });
    if (!managerUser) {
      return next(new AppError('Manager not found or is not an active sales manager', 400));
    }
  }

  const user = await User.create({
    name,
    email,
    phone,
    password,
    role,
    isActive,
    manager: role === 'sales_executive' ? manager : undefined,
  });

  user.password = undefined;
  sendResponse(res, 201, 'User created successfully', { user });
});

const getUsers = asyncHandler(async (req, res, next) => {
  const { search, role, isActive, sortBy, order } = req.query;
  const { skip, limit, buildMeta } = getPagination(req.query);

  const query = {};

  if (search) {
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchRegex = new RegExp(escapedSearch, 'i');
    query.$or = [{ name: searchRegex }, { email: searchRegex }];
  }

  if (role) query.role = role;
  if (isActive !== undefined) query.isActive = isActive === 'true';

  let sortOptions = { createdAt: -1 };
  if (sortBy) {
    sortOptions = {};
    sortOptions[sortBy] = order === 'asc' ? 1 : -1;
  }

  const [users, totalRecords] = await Promise.all([
    User.find(query).skip(skip).limit(limit).sort(sortOptions).select('-password -refreshToken').populate('manager', 'name email'),
    User.countDocuments(query),
  ]);

  sendResponse(res, 200, 'Users fetched successfully', {
    users,
    meta: buildMeta(totalRecords),
  });
});

const getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id).select('-password -refreshToken').populate('manager', 'name email');
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  sendResponse(res, 200, 'User fetched successfully', { user });
});

const updateUser = asyncHandler(async (req, res, next) => {
  const { name, phone, role, manager } = req.body;
  const user = await User.findById(req.params.id);
  
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  if (role === 'sales_executive' && manager) {
    const managerUser = await User.findOne({ _id: manager, role: 'sales_manager', isActive: true });
    if (!managerUser) {
      return next(new AppError('Manager not found or is not an active sales manager', 400));
    }
    user.manager = manager;
  } else if (role && role !== 'sales_executive') {
    user.manager = undefined;
  }

  if (name) user.name = name;
  if (phone) user.phone = phone;
  if (role) user.role = role;

  await user.save();
  user.password = undefined;
  user.refreshToken = undefined;

  sendResponse(res, 200, 'User updated successfully', { user });
});

const updateUserStatus = asyncHandler(async (req, res, next) => {
  const { isActive } = req.body;
  
  if (req.params.id === req.user.id.toString()) {
    return next(new AppError('You cannot deactivate your own account', 400));
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isActive },
    { new: true, runValidators: true }
  ).select('-password -refreshToken');

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  sendResponse(res, 200, 'User status updated successfully', { user });
});

const deleteUser = asyncHandler(async (req, res, next) => {
  if (req.params.id === req.user.id.toString()) {
    return next(new AppError('You cannot delete your own account', 400));
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Check if user has assigned leads, customers or deals
  const hasLeads = await Lead.exists({ assignedTo: req.params.id });
  const hasCustomers = await Customer.exists({ assignedTo: req.params.id });
  const hasDeals = await Deal.exists({ assignedTo: req.params.id });

  if (hasLeads || hasCustomers || hasDeals) {
    return next(new AppError('User has assigned entities (leads, customers, or deals). Please deactivate the user instead of deleting.', 400));
  }

  await User.findByIdAndDelete(req.params.id);
  
  sendResponse(res, 200, 'User deleted successfully');
});

module.exports = {
  createUser,
  getUsers,
  getUser,
  updateUser,
  updateUserStatus,
  deleteUser,
};
