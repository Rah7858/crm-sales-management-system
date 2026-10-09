const Lead = require('../models/Lead');
const Customer = require('../models/Customer');
const Deal = require('../models/Deal');
const Activity = require('../models/Activity');
const User = require('../models/User');
const { getAccessFilter } = require('../utils/accessControl');
const AppError = require('../utils/AppError');

const getDashboardStats = async (user) => {
  const filter = await getAccessFilter(user);

  const [
    totalLeads, newLeads, qualifiedLeads, convertedLeads,
    totalCustomers,
    totalDeals, openDealsCount, wonDealsCount, lostDealsCount,
    revenueData, expectedRevenueData,
    pendingActivities, overdueActivities
  ] = await Promise.all([
    Lead.countDocuments({ ...filter }),
    Lead.countDocuments({ ...filter, status: 'new' }),
    Lead.countDocuments({ ...filter, status: 'qualified' }),
    Lead.countDocuments({ ...filter, status: 'converted' }),

    Customer.countDocuments({ ...filter }),

    Deal.countDocuments({ ...filter }),
    Deal.countDocuments({ ...filter, stage: { $nin: ['won', 'lost'] } }),
    Deal.countDocuments({ ...filter, stage: 'won' }),
    Deal.countDocuments({ ...filter, stage: 'lost' }),

    Deal.aggregate([
      { $match: { ...filter, stage: 'won' } },
      { $group: { _id: null, total: { $sum: '$value' } } }
    ]),

    Deal.aggregate([
      { $match: { ...filter, stage: { $nin: ['won', 'lost'] } } },
      { $group: { _id: null, total: { $sum: '$expectedRevenue' } } }
    ]),

    Activity.countDocuments({ ...filter, status: 'pending' }),
    Activity.countDocuments({ ...filter, status: 'pending', dueDate: { $lt: new Date() } }),
  ]);

  const totalRevenue = revenueData.length > 0 ? revenueData[0].total : 0;
  const expectedRevenue = expectedRevenueData.length > 0 ? expectedRevenueData[0].total : 0;

  const conversionRate = totalLeads === 0 ? 0 : Number(((convertedLeads / totalLeads) * 100).toFixed(2));

  return {
    totalLeads,
    newLeads,
    qualifiedLeads,
    convertedLeads,
    totalCustomers,
    totalDeals,
    openDeals: openDealsCount,
    wonDeals: wonDealsCount,
    lostDeals: lostDealsCount,
    totalRevenue,
    expectedRevenue,
    conversionRate,
    pendingActivities,
    overdueActivities
  };
};

const getDashboardPipeline = async (user) => {
  const filter = await getAccessFilter(user);

  const pipelineAgg = await Deal.aggregate([
    { $match: { ...filter } },
    { $group: { _id: '$stage', count: { $sum: 1 }, value: { $sum: '$value' } } }
  ]);

  const stages = ['qualification', 'discovery', 'proposal', 'negotiation', 'won', 'lost'];
  const result = {};

  stages.forEach(stage => {
    result[stage] = { count: 0, value: 0 };
  });

  pipelineAgg.forEach(st => {
    if (result[st._id]) {
      result[st._id].count = st.count;
      result[st._id].value = st.value;
    }
  });

  return result;
};

const getTeamPerformance = async (user) => {
  if (user.role === 'sales_executive') {
    throw new AppError('You do not have permission to access team performance', 403);
  }

  let matchQuery = { role: 'sales_executive', isActive: true };
  if (user.role === 'sales_manager') {
    matchQuery.manager = user._id;
  }

  const executives = await User.find(matchQuery, 'name email role');

  const performance = await Promise.all(executives.map(async (exec) => {
    const execId = exec._id;

    const [
      leads, convertedLeads, dealsWon, revenueAgg, pendingActivities, overdueActivities
    ] = await Promise.all([
      Lead.countDocuments({ assignedTo: execId }),
      Lead.countDocuments({ assignedTo: execId, status: 'converted' }),
      Deal.countDocuments({ assignedTo: execId, stage: 'won' }),
      Deal.aggregate([
        { $match: { assignedTo: execId, stage: 'won' } },
        { $group: { _id: null, total: { $sum: '$value' } } }
      ]),
      Activity.countDocuments({ assignedTo: execId, status: 'pending' }),
      Activity.countDocuments({ assignedTo: execId, status: 'pending', dueDate: { $lt: new Date() } }),
    ]);

    return {
      user: exec,
      leads,
      convertedLeads,
      dealsWon,
      revenue: revenueAgg.length > 0 ? revenueAgg[0].total : 0,
      pendingActivities,
      overdueActivities
    };
  }));

  return performance;
};

module.exports = {
  getDashboardStats,
  getDashboardPipeline,
  getTeamPerformance,
};
