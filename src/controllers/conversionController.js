const conversionService = require('../services/conversionService');
const asyncHandler = require('../utils/asyncHandler');
const sendResponse = require('../utils/sendResponse');

const convertLead = asyncHandler(async (req, res, next) => {
  const result = await conversionService.convertLead(req.params.id, req.body, req.user);
  sendResponse(res, 200, 'Lead converted successfully', result);
});

module.exports = {
  convertLead,
};
