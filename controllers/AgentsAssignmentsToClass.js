const AgentsAssignmentsToClassModel = require('../models/AgentsAssignmentsToClass.model');
const momentTZ = require('moment-timezone');

exports.getAdminAssignedSchedules = async (req, res) => {
  try {
    const { agentId } = req.params;
    let agentSchedules = await AgentsAssignmentsToClassModel.find({
      date: {
        $gte: momentTZ().tz('Asia/Kolkata').startOf('day').format(),
        $lte: momentTZ().tz('Asia/Kolkata').endOf('day').format(),
      },
    })
      .populate('agent', 'AgentName')
      .lean();
    let finalObject = {};
    let mySchedules = [];
    agentSchedules.forEach((schedule) => {
      if (
        schedule.agent &&
        schedule.agent.AgentName &&
        schedule.agentId !== agentId
      ) {
        finalObject[schedule.agent.AgentName] = schedule.scheduleIds;
      } else if (schedule.agentId === agentId) {
        mySchedules = schedule.scheduleIds;
      }
    });

    return res.json({ result: { finalObject, mySchedules } });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: 'Soemthing went wrong!',
    });
  }
};

exports.updateScheduleIdsOfAnAdmin = async (req, res) => {
  try {
    const { agentId } = req.body;
    let agentsAssignments = await AgentsAssignmentsToClassModel.findOne({
      agentId,
      date: {
        $gte: momentTZ().tz('Asia/Kolkata').startOf('day').format(),
        $lte: momentTZ().tz('Asia/Kolkata').endOf('day').format(),
      },
    });
    if (agentsAssignments) {
      agentsAssignments.scheduleIds = [...req.body.scheduleIds];
      await agentsAssignments.save();
      return res.json({
        message: 'Assigned to your class Successfully',
      });
    } else {
      let newAgentsAssignments = new AgentsAssignmentsToClassModel(req.body);
      await newAgentsAssignments.save();
      return res.json({
        message: 'Assigned to your First class Successfully',
      });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      error: 'Something went wrong!',
    });
  }
};
