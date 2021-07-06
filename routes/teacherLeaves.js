const express = require('express');
const {
	deleteAleaveByLeaveId,
	updateALeaveByLeaveId,
	postALeave,
	getTeacherLeavesByTeacherId,
	getAllTeachersLeaves,
	getTodayLeavesOfTeacher
} = require('../controllers/teacherLeave.controller');
const router = express.Router();


router.get('/', getAllTeachersLeaves);
router.get('/today',getTodayLeavesOfTeacher);
router.post('/', postALeave);
router.get('/:id', getTeacherLeavesByTeacherId);
router.put('/:id', updateALeaveByLeaveId);
router.delete('/:id', deleteAleaveByLeaveId);

module.exports = router;
