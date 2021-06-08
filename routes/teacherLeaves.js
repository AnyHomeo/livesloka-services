const express = require('express');
const {
	deleteAleaveByLeaveId,
	updateALeaveByLeaveId,
	postALeave,
	getTeacherLeavesByTeacherId,
	getAllTeachersLeaves,
} = require('../controllers/teacherLeave.controller');
const router = express.Router();

router.get('/', getAllTeachersLeaves);
router.post('/', postALeave);
router.get('/:id', getTeacherLeavesByTeacherId);
router.put('/:id', updateALeaveByLeaveId);
router.delete('/:id', deleteAleaveByLeaveId);

module.exports = router;
