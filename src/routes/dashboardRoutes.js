const express = require('express');
const {
  getStats,
  getPipeline,
  getTeamPerformance,
} = require('../controllers/dashboardController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

const router = express.Router();

router.use(authenticate);

router.get('/stats', getStats);
router.get('/pipeline', getPipeline);
router.get('/team-performance', authorize('admin', 'sales_manager'), getTeamPerformance);

module.exports = router;
