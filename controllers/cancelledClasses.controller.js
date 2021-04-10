const CancelledClassesModel = require("../models/CancelledClasses.model");
const  moment = require('moment');
const  momentTZ = require('moment-timezone');
const CustomerModel = require("../models/Customer.model");
const SchedulerModel = require("../models/Scheduler.model");

exports.getAllAppliedLeaves = async (req,res) => {
  try {
    const today = moment().startOf('day')
    const data = await CancelledClassesModel.find({
      cancelledDate :{
        $gte: today.toDate(),
       },
    }).populate("studentId","firstName lastName").populate("scheduleId","className").sort("createdAt")
    return res.json({
      message:"Retrieved successfully!!",
      result:data
    })
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      error:"Something went wrong!!"
    })
  }
}

exports.getAllAppliedLeavesByScheduleId = async (req,res) => {
  try {
    const { scheduleId } = req.params
    const today = moment().startOf('day')
    let data = await CancelledClassesModel.find({
      cancelledDate :{
        $gte: today.toDate(),
        $lte: moment(today).endOf('day').toDate(),
       },
     
      scheduleId
  })
  return res.json({ 
      message:"Retrieved Successfully",
      result:data
    })
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      error:"Something went wrong!!"
    })
  }
}

exports.CancelAClass = async (req, res) => {
  try {
    req.body.cancelledDate = new Date(req.body.cancelledDate);
    var diff = Math.abs(req.body.cancelledDate.getTime() - new Date().getTime()) / 3600000;
    if(diff >= 9){
      let { studentId,scheduleId } = req.body
      let studentIds = await CustomerModel.find({email:studentId}).select("_id").lean()
      studentIds = studentIds.map(id => id._id)
      let scheduleUsers = await SchedulerModel.findById(scheduleId).select("students").lean()
      scheduleUsers = scheduleUsers.students
      let selectedUser = ""
      for (let i = 0; i < studentIds.length; i++) {
        const student = studentIds[i];
        for (let j = 0; j < scheduleUsers.length; j++) {
          const schedule = scheduleUsers[j];
          if(schedule.equals(student)){
            selectedUser = student
            break
          }
        }
        if(selectedUser) break;
      }
      if(!selectedUser){
        return res.status(500).json({
          error:"Invalid User"
        })
      }
      req.body.studentId = selectedUser
      let alreadyExists = await CancelledClassesModel.findOne({studentId:req.body.studentId,scheduleId:req.body.scheduleId})
      
      let oldDate =  alreadyExists ? alreadyExists.cancelledDate : ""
      let newDate = req.body.cancelledDate
      alreadyExists = JSON.stringify(oldDate).split("T")[0] === JSON.stringify(newDate).split("T")[0]
      if(!alreadyExists){
        const cancelledClass = new CancelledClassesModel(req.body);
        await cancelledClass.save();
        return res.status(200).json({
          message: "applied for Leave successfully!",
        });
      }
      return res.status(400).json({
        error:"Already Applied on same day!"
      })
    }else {
      return res.status(400).json({
        error:"Please Contact admin,Cancelling date is less than 9 Hours"
      })
    }
    
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: "Something went wrong!",
    });
  }
};

exports.updateCancelledClass = async (req, res) => {
  try {
    let updatedData = await CancelledClassesModel.updateOne(
      { _id: req.body._id },
      { ...req.body }
    );
    console.log(updatedData)
    return res.json({
      message: "Updated Successfully!",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: "Something went wrong!",
    });
  }
};

exports.deleteCancelledClass = async (req, res) => {
  try {
    let deletedClass = await CancelledClassesModel.deleteOne({
      _id: req.params.id,
    });
    return res.json({
      message: "Deleted Successfully!",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: "Something went wrong!",
    });
  }
};
