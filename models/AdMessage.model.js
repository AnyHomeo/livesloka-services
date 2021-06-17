const mongoose = require('mongoose');
const mongooseLeanVirtuals = require('mongoose-lean-virtuals');
const AdMessageSchema = new mongoose.Schema(
	{
		adminIds: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'Admin',
			},
		],
		background: String,
		message: String,
		id: Number,
		icon: String,
		title: String,
		isForAll: Boolean,
		queryType: {
			type: String,
			enum: ['customers', 'classname', 'teacher', 'agent'],
		},
		broadcastedBy: {
			type: String,
			required: 'Agent Required',
		},
		acknowledgedBy: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'Admin',
			},
		],
		scheduleIds: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'Schedule',
			},
		],
		teacherIds: [
			{
				type: String,
			},
		],
		agentIds: [
			{
				type: String,
			},
		],
        expiryDate:{
            type:Date
        }
	},
	{
		timeStamps: true,
	}
);

AdMessageSchema.virtual('usersCount').get(function(){
	return this.adminIds.length
})

AdMessageSchema.virtual('schedulesCount').get(function(){
	return this.scheduleIds.length
})

AdMessageSchema.virtual('users',{
	ref:'Admin',
	localField:'adminIds',
	foreignField:'_id',
	options:{
		limit: 5
	}
})

AdMessageSchema.virtual('schedules',{
	ref:'Schedule',
	localField:'scheduleIds',
	foreignField:'_id',
	options:{
		limit: 3
	},
})

AdMessageSchema.virtual('teachers',{
	ref:'Teacher',
	localField:'teacherIds',
	foreignField:'id',
})

AdMessageSchema.virtual('admin',{
	ref:'Agent',
	localField:'broadcastedBy',
	foreignField:'id',
	justOne:true
})

AdMessageSchema.virtual('agents',{
	ref:'Agent',
	localField:'agentIds',
	foreignField:'id',
})


AdMessageSchema.plugin(mongooseLeanVirtuals);

module.exports = mongoose.model('AdMessages', AdMessageSchema);
