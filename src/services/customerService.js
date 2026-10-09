const Customer = require('../models/Customer');
const User = require('../models/User');
const Deal = require('../models/Deal');
const AppError = require('../utils/AppError');
const { logEvent } = require('./timelineService');
const { canAccessRecord, getTeamUserIds } = require('../utils/accessControl');

const createCustomer = async (data, user) => {
  let assignedTo = user._id;

  if (user.role === 'admin' || user.role === 'sales_manager') {
    if (data.assignedTo) {
      const assignee = await User.findOne({ _id: data.assignedTo, role: 'sales_executive', isActive: true });
      if (!assignee) throw new AppError('Assignee must be an active sales executive', 400);
      
      if (user.role === 'sales_manager') {
        const teamIds = await getTeamUserIds(user._id);
        if (!teamIds.some((id) => id.toString() === data.assignedTo) && data.assignedTo !== user._id.toString()) {
          throw new AppError('Manager can only assign to their own team members', 403);
        }
      }
      assignedTo = data.assignedTo;
    }
  }

  const customer = await Customer.create({
    ...data,
    assignedTo,
    createdBy: user._id,
  });

  await logEvent({
    action: 'customer_created',
    entityType: 'customer',
    entityId: customer._id,
    performedBy: user._id,
  });

  return customer;
};

const updateCustomer = async (id, data, user) => {
  const customer = await Customer.findById(id);
  if (!customer) throw new AppError('Customer not found', 404);

  const hasAccess = await canAccessRecord(user, customer);
  if (!hasAccess) throw new AppError('You do not have permission to access this customer', 403);

  Object.assign(customer, data);
  await customer.save();

  return customer;
};

const deleteCustomer = async (id, user) => {
  const customer = await Customer.findById(id);
  if (!customer) throw new AppError('Customer not found', 404);

  const hasDeals = await Deal.exists({ customer: id });
  if (hasDeals) {
    throw new AppError('Cannot delete customer with associated deals', 400);
  }

  await Customer.findByIdAndDelete(id);
};

module.exports = {
  createCustomer,
  updateCustomer,
  deleteCustomer,
};
