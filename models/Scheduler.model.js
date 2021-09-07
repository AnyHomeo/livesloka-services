const mongoose = require('mongoose');

const SchedulerSchema = new mongoose.Schema(
	{
		teacher: {
			type: String,
			trim: true,
			required: 'Teacher is Required',
		}, 
		students: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'Customer',
			},
		],
		slots: {
			monday: {
				type:Array,
				default:[]
			},
			tuesday: {
				type:Array,
				default:[]
			},
			wednesday: {
				type:Array,
				default:[]
			},
			thursday: {
				type:Array,
				default:[]
			},
			friday: {
				type:Array,
				default:[]
			},
			saturday: {
				type:Array,
				default:[]
			},
			sunday: {
				type:Array,
				default:[]
			},
		},
		meetingLink: {
			trim: true,
			type: String,
		},
		meetingAccount: {
			trim: true,
			type: mongoose.Schema.Types.ObjectId,
			ref: 'ZoomAccount',
		},
		startDate: {
			type: Date, 
			required: 'Start Date is Required',
		},
		subject: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Subject',
			required: 'Subject is Required',
		},
		scheduleDescription: {
			type: String,
			trim: true,
		},
		className: {
			type: String,
			trim: true,
		},
		demo: {
			type: Boolean,
			default: false,
		},
		OneToOne: {
			type: Boolean,
			default: false,
		},
		oneToMany: {
			type: Boolean,
			default: false,
		},
		isDeleted: {
			type: Boolean,
			default: false,
		},
		materials: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Upload' }],
		lastTimeJoinedClass: {
			type: Date,
		},
		isClassTemperarilyCancelled: {
			type: Boolean,
			default: false,
		},
		message: {
			type: String,
			default: '',
		},
		isZoomMeeting: {
			type: Boolean,
			default: true,
		},
		wherebyHostUrl: {
			type: String,
			trim: true,
		},
		wherebyMeetingId: {
			type: String,
			trim: true,
		},
		isSummerCampClass: {
			type: Boolean,
			default: false,
		},
		summerCampAmount: {
			type: Number,
			default: 0,
		},
		summerCampTitle: {
			type: String,
			trim: true,
		},
		summerCampDescription: {
			type: String,
			trim: true,
		},
		summerCampSchedule: String,
		summerCampImage: {
			type: String,
			trim: true,
		},
		summerCampStudentsLimit: {
			type: Number,
		},
		summerCampClassNumberOfDays: {
			type: Number,
		},
	},
	{ timestamps: true }
);

module.exports = mongoose.model('Schedule', SchedulerSchema);
