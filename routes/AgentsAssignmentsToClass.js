const express = require('express');
const {
  updateScheduleIdsOfAnAdmin,
  getAdminAssignedSchedules,
} = require('../controllers/AgentsAssignmentsToClass');
const router = express.Router();

router.post('/', updateScheduleIdsOfAnAdmin);
router.get('/:agentId', getAdminAssignedSchedules);

module.exports = router;
