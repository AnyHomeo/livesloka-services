const express = require('express');
const router = express.Router();

const {
  validateSlot,
  getAvailableSlots,
  getTeachers,
  deleteSlot,
  getAllTEachers,
  getOccupancyDashboardData,
  getAllDaysSlots,
  GetTeacherMeetings,
  joinClass,
  GetSalaries,
  getTeacherDetailsById,
  getTeacherLeavesAndSchedules,
  addAvailableSlot,
} = require('../controllers/teacher.controller');

router.get('/join/:scheduleId/:teacherId', joinClass);
router.post('/add/available/:id', validateSlot, addAvailableSlot);
router.get('/available/:id', getAvailableSlots);
router.get('/', getTeachers);
router.post('/delete/slot/:id', validateSlot, deleteSlot);
router.get('/finance', getAllTEachers);
router.get('/occupancy', getOccupancyDashboardData);
router.get('/all/slots/:id', getAllDaysSlots);
router.get('/getTeacherMeetings/:id', GetTeacherMeetings);
router.get('/get/salary/:id', GetSalaries);
router.get('/get/teacherDetails/:id', getTeacherDetailsById);
router.get('/timetable/:id', getTeacherLeavesAndSchedules);

module.exports = router;
