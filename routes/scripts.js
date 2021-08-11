const express = require("express");
const router = express.Router();
const CustomerModel = require("../models/Customer.model");
const SchedulerModel = require("../models/Scheduler.model");

router.get('/demoAndInclass', async (req, res, next) =>{
    const { demo,inclass } = req.query;
    if(!demo){
        return res.status(500).json({ error:"Demo Temperary Id Required"});
    }
    if(!inclass){
        return res.status(500).json({ error:"Inclass Temperary Id Required"});
    }

    await CustomerModel.updateMany({
        classStatusId:"38493085684944"
    },{classStatusId:demo})

    await CustomerModel.updateMany({
        classStatusId:"113975223750050"
    },{classStatusId:inclass})

    let allSchedules = await SchedulerModel.find({
        isDeleted: {
          $ne: true,
        },
      })
        .select("students demo")
        .populate("students", "firstName lastName email")
        .lean();
      let totalStudents = 0
     let sortedStudents = allSchedules.reduce((accumulator,schedule,i)=>{
         totalStudents += schedule.students.length;
        if(schedule.demo){
            accumulator.demo = [...accumulator.demo,...schedule.students.map(i => i._id)];
        } else {
            accumulator.inClass = [...accumulator.inClass,...schedule.students.map(i => i._id)];
        }
        return accumulator;
    },{demo:[],inClass:[]})

    await CustomerModel.updateMany({
        _id:{
            $in:sortedStudents.demo
        }
    },{classStatusId:"38493085684944"})

    await CustomerModel.updateMany({
        _id:{
            $in: sortedStudents.inClass
        }
    },{classStatusId:"113975223750050"})

    return res.json({
        result:"updated successfully!"
    })
});

module.exports = router;