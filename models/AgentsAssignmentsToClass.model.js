const mongoose = require('mongoose');
const mongooseLeanVirtuals = require('mongoose-lean-virtuals');

var AgentAssignmentsToClassSchema = new mongoose.Schema(
  {
    agentId: {
      type: String,
    },
    scheduleIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Schedule',
      },
    ],
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

AgentAssignmentsToClassSchema.virtual('agent', {
  ref: 'Agent',
  localField: 'agentId',
  foreignField: 'id',
  justOne: true,
});

AgentAssignmentsToClassSchema.plugin(mongooseLeanVirtuals);

module.exports = mongoose.model(
  'AgentAssignmentsToClass',
  AgentAssignmentsToClassSchema
);
