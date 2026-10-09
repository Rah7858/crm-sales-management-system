const dashboardService = require('../services/dashboardService');
const asyncHandler = require('../utils/asyncHandler');
const sendResponse = require('../utils/sendResponse');

const getStats = asyncHandler(async (req, res, next) => {
  const stats = await dashboardService.getDashboardStats(req.user);
  sendResponse(res, 200, 'Dashboard stats fetched successfully', stats);
});

const getPipeline = asyncHandler(async (req, res, next) => {
  const pipeline = await dashboardService.getDashboardPipeline(req.user);
  sendResponse(res, 200, 'Pipeline fetched successfully', pipeline);
});

const getTeamPerformance = asyncHandler(async (req, res, next) => {
  const performance = await dashboardService.getTeamPerformance(req.user);
  sendResponse(res, 200, 'Team performance fetched successfully', performance);
});

module.exports = {
  getStats,
  getPipeline,
  getTeamPerformance,
};
