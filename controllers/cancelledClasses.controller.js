const CancelledClassesModel = require("../models/CancelledClasses.model");
const  moment = require('moment');
const  momentTZ = require('moment-timezone');
const CustomerModel = require("../models/Customer.model");
const SchedulerModel = require("../models/Scheduler.model");
const timeZoneModel = require("../models/timeZone.model");
const allZones = require("../models/timeZone.json");
const generateScheduleDays = require("../scripts/generateScheduleDays");
const AgentModel = require("../models/Agent.model");
const { getStartAndEndTime } = require("../scripts/getStartAndEndTime");


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
    let data = await CancelledClassesModel.find({
      cancelledDate :{
        $gte: moment().startOf('day').toDate(),
        $lte: moment().endOf('day').toDate(),
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

const add12 = (time) => {
  let hours = time.split(":")[0]
  let mins = time.split(":")[1]
console.log((parseInt(hours)+12) + ":" + mins)
  return (parseInt(hours)+12) + ":" + mins
}

const getTimeZoneString = (tz) => {
  let selectedZoneUTCArray = allZones.filter(
    (zone) => zone.abbr === tz
  )[0].utc;
  let allTimeZones = momentTZ.tz.names();
  let selectedZones = allTimeZones.filter((name) =>
    selectedZoneUTCArray.includes(name)
  );
    console.log(selectedZones[0])
  return selectedZones[0]
}

exports.CancelAClass = async (req, res) => {
  try {
    const { isAdmin } = req.query
    let { studentId,scheduleId } = req.body
    let schedule = await SchedulerModel.findById(scheduleId).select("students slots ").lean()
    let studentIds = await CustomerModel.find({email:studentId}).select("_id timeZoneId").lean()
    let timeZone = await timeZoneModel.findOne({id:studentIds[0].timeZoneId}).lean()
    let timeZoneString = getTimeZoneString(timeZone.timeZoneName)
    studentIds = studentIds.map(id => id._id)
    let scheduleUsers = schedule.students
    let diffDate = new Date(req.body.cancelledDate)
    var diff = Math.abs(diffDate.getTime() - new Date().getTime()) / 3600000;
    if(diff >= 9 && !isAdmin){
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
      let startOfSelectedDay = momentTZ(req.body.cancelledDate).tz(timeZoneString).tz("Asia/Kolkata").startOf("day");
      let endOfSelectedDay = momentTZ(req.body.cancelledDate).tz(timeZoneString).tz("Asia/Kolkata").endOf("day");
      console.log(momentTZ(req.body.cancelledDate))
      let startDay = startOfSelectedDay.format("dddd").toLowerCase();
      let endDay = endOfSelectedDay.format("dddd").toLowerCase();
      let timeFromStartDay = getStartAndEndTime(schedule.slots[startDay])
      let timeFromEndDay = getStartAndEndTime(schedule.slots[endDay])
      console.log(timeFromStartDay,timeFromEndDay,startDay,endDay,schedule.slots)
      if(timeFromStartDay){
        timeFromStartDay = timeFromStartDay.split("-")[0].trim()
        let isAm = timeFromStartDay.split(" ")[1].toLowerCase() === "am"
        let time = timeFromStartDay.split(" ")[0]
        req.body.cancelledDate = moment(momentTZ.tz(startOfSelectedDay.format("YYYY-MM-DD") + " " + (isAm ? time : add12(time)) ,"Asia/Kolkata").format()).subtract(5.5,"hours").format()
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
      } else if(timeFromEndDay){
        timeFromEndDay = timeFromEndDay.split("-")[0].trim()
        let isAm = timeFromEndDay.split(" ")[1].toLowerCase() === "am"
        let time = timeFromEndDay.split(" ")[0]
        console.log(momentTZ.tz(endOfSelectedDay.format("YYYY-MM-DD") + " " + (isAm ? time : add12(time)) ,"Asia/Kolkata").format())
        req.body.cancelledDate = moment(momentTZ.tz(endOfSelectedDay.format("YYYY-MM-DD") + " " + (isAm ? time : add12(time)) ,"Asia/Kolkata").format()).subtract(5.5,"hours").format()
        console.log(req.body.cancelledDate)
        let alreadyExists = await CancelledClassesModel.findOne({studentId:req.body.studentId,scheduleId:req.body.scheduleId})
        let oldDate =  alreadyExists ? alreadyExists.cancelledDate : ""
        let newDate = req.body.cancelledDate
        console.log(req.body.cancelledDate)
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
      }
    }
    else if(isAdmin){
      let scheduleId = await SchedulerModel.findOne({students: req.body.studentId,isDeleted:{
        $ne: true
      }})
      if(scheduleId){
        req.body.scheduleId = scheduleId._id
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
      } else {
        return res.status(400).json({
          error:"No Schedule to user!"
        })
      }

    }else{
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
    req.body.cancelledDate = new Date(req.body.cancelledDate);
    var diff = Math.abs(req.body.cancelledDate.getTime() - new Date().getTime()) / 3600000;
    if(diff >= 9){
      let updatedData = await CancelledClassesModel.updateOne(
        { _id: req.body._id },
        { ...req.body }
      );
      return res.json({
        message: "Updated Successfully!",
      });
    } else {
      return res.status(500).json({
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

exports.getUserDaysToCancel = async (req,res) => {
  try {
    const { id } = req.params;
    const { agent } = req.query;
    let scheduleOfThisUser = await SchedulerModel.findOne({
      isDeleted:{
        $ne:true
      },
      students: {
        $in: [id]
      }
    }).lean()
    let agentData = await AgentModel.findOne({id:agent})
    let selectedZoneUTCArray = allZones.filter(
      (zone) => zone.abbr === agentData.AgentTimeZone
    )[0].utc;
    let allTimeZones = momentTZ.tz.names();
    let selectedZone = allTimeZones.filter((name) =>
      selectedZoneUTCArray.includes(name)
    )[0];
    return res.json({
      result: scheduleOfThisUser ? generateScheduleDays(
        scheduleOfThisUser.slots,
        selectedZone
      ) : []
    })
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      error:"Something went wrong!!"
    })
  }
}

exports.getStartTimesOfEntireDay = async (req,res) => {

  try {
    let {date,agent,customerId} = req.query
    let agentData = await AgentModel.findOne({id:agent})
    let schedule = await SchedulerModel.findOne({
      isDeleted:{
        $ne: true
      },
      students:{
       $in: [customerId]
      }
    }).lean()
    let selectedZoneUTCArray = allZones.filter(
      (zone) => zone.abbr === agentData.AgentTimeZone
    )[0].utc;
    let allTimeZones = momentTZ.tz.names();
    let selectedZone = allTimeZones.filter((name) =>
      selectedZoneUTCArray.includes(name)
    )[0];
    let startTimeDay = momentTZ.tz(date,selectedZone).startOf("day").clone().tz("Asia/Kolkata");
    let endTimeDay = momentTZ.tz(date,selectedZone).endOf("day").clone().tz("Asia/Kolkata");
    let startTimeDayString = startTimeDay.format("dddd").toLowerCase();
    let endTimeDayString = endTimeDay.format("dddd").toLowerCase();
    if(schedule){
      console.log(schedule.slots[startTimeDayString])
      console.log("Start", getStartAndEndTime(schedule.slots[startTimeDayString]).split("-")[0])
      console.log(getStartAndEndTime(schedule.slots[endTimeDayString]).split("-")[0])

      if(startTimeDayString === endTimeDayString){
        let time = getStartAndEndTime(schedule.slots[startTimeDayString]).split("-")[0]
        return res.json({
          result : [
            momentTZ.tz(startTimeDay.format("YYYY-MM-DD") + " " + time,"Asia/Kolkata").format()
          ]
        })
      } else {
         let endTime = getStartAndEndTime(schedule.slots[endTimeDayString]).split("-")[0]
         let startTime = getStartAndEndTime(schedule.slots[startTimeDayString]).split("-")[0]
         if(startTime){
          return res.json({
            result:[
              momentTZ.tz(startTimeDay.format("YYYY-MM-DD") + " " + startTime,"Asia/Kolkata").clone().tz(selectedZone).format()
            ]
          })
         } else {
           return res.json({
             result:[
              momentTZ.tz(endTimeDay.format("YYYY-MM-DD") + " " + endTime,"Asia/Kolkata").clone().tz(selectedZone).format()
             ]
           })
         }
        //  if(endTime){
        //   let endTimeNumber = parseInt(endTime.split(":")[0]) + (parseInt(endTime.split(":")[1].split(" ")[0]) === 30 ? 0.5 : 0)
        //   let secondEndTime = parseInt(endTimeDay.format("hh")) + parseInt(endTimeDay.format("mm"))/60
        //   if(endTimeNumber > secondEndTime){
        //     return res.json({
        //       result:[
        //         getStartAndEndTime(schedule.slots[endTimeDayString]).split("-")[0],
        //         getStartAndEndTime(schedule.slots[startTimeDayString]).split("-")[0]
        //       ]
        //     })
        //   }
        //  }
      }
    } else {
      return res.status(500).json({
        error:"No Schedule For User"
      })
    }

  } catch (error) {
    console.log(error)
    return res.status(500).json({
      error:"something went wrong"
    })
  }

}