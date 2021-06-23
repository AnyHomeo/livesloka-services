const mongoose = require('mongoose');

const TeacherLeaves = new mongoose.Schema(
	{
		teacherId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Teacher',
		},
		date: {
			type: Date,
		},
		entireDay: { 
			type: Boolean,
			default: false,
		},
		scheduleId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Schedule',
		},
	},
	{ timestamps: true }
);

module.exports = mongoose.model('TeacherLeaves', TeacherLeaves);
