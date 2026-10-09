const mongoose = require('mongoose');
const Lead = require('../models/Lead');
const Customer = require('../models/Customer');
const Deal = require('../models/Deal');
const AppError = require('../utils/AppError');
const { canAccessRecord } = require('../utils/accessControl');
const { logEvent } = require('./timelineService');

const convertLead = async (leadId, data, user) => {
  const lead = await Lead.findById(leadId);
  if (!lead) throw new AppError('Lead not found', 404);

  const hasAccess = await canAccessRecord(user, lead);
  if (!hasAccess) throw new AppError('You do not have permission to access this lead', 403);

  if (lead.isConverted) {
    throw new AppError('Lead is already converted', 409);
  }

  if (lead.status !== 'qualified') {
    throw new AppError('Only qualified leads can be converted', 400);
  }

  const session = await mongoose.startSession();
  let result = null;

  try {
    await session.withTransaction(async () => {
      // 1. Create Customer
      const [customer] = await Customer.create(
        [
          {
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            company: lead.company,
            lead: lead._id,
            assignedTo: lead.assignedTo,
            createdBy: user._id,
          },
        ],
        { session }
      );

      // 2. Create Deal
      const expectedRevenue = (data.dealValue * data.probability) / 100;
      const [deal] = await Deal.create(
        [
          {
            name: data.dealName,
            lead: lead._id,
            customer: customer._id,
            assignedTo: lead.assignedTo,
            value: data.dealValue,
            probability: data.probability,
            expectedRevenue,
            expectedClosingDate: data.expectedClosingDate,
            stage: 'qualification',
            description: data.description,
            createdBy: user._id,
          },
        ],
        { session }
      );

      // 3. Update Lead
      lead.status = 'converted';
      lead.isConverted = true;
      lead.customer = customer._id;
      await lead.save({ session });

      // 4. Write timeline entries
      await logEvent({
        action: 'lead_converted',
        entityType: 'lead',
        entityId: lead._id,
        performedBy: user._id,
        session,
      });

      await logEvent({
        action: 'customer_created',
        entityType: 'customer',
        entityId: customer._id,
        performedBy: user._id,
        session,
      });

      await logEvent({
        action: 'deal_created',
        entityType: 'deal',
        entityId: deal._id,
        performedBy: user._id,
        session,
      });

      result = { customer, deal, lead };
    });
  } finally {
    await session.endSession();
  }

  return result;
};

module.exports = {
  convertLead,
};
