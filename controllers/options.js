const CustomerModel = require("../models/Customer.model");
const TeacherModel = require("../models/Teacher.model");
const OptionsModel = require("../models/SlotOptions");
const ObjectId = require('mongoose').Types.ObjectId;
const SchedulerModel = require("../models/Scheduler.model");

exports.getTeacherSlots = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const selectedTeacher = await TeacherModel.findOne({
      id:teacherId,
    })
      .select("TeacherName availableSlots")
      .lean();

    let schedules = await SchedulerModel.find({
      teacher:teacherId,
      isDeleted:{
        $ne:true
      },
      demo:false
    }).select("scheduleDescription className")

    return res.json({
      result: {...selectedTeacher,schedules},
      message: "Teacher retrieved successfully!!",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Something went wrong!" });
  }
};

exports.getOnlyDemoCustomers = async (req, res) => {
  try {
    let { select } = req.query;
    if(select) {
        select = select.split(",").join(" ");
    }
    const demoCustomers = await CustomerModel.find({
      classStatusId: "38493085684944",
    })
      .select(select)
      .lean();

    return res.json({
      message: "Demo customers retrieved successfully",
      result: demoCustomers,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Something went wrong!" });
  }
};

exports.postAnOption = async (req,res) => {
  try {
    const { customer,options,teacher } = req.body

    if(!customer){
      return res.status(400).json({ error: "Customer Id is Required!" });
    }

    if(!teacher){
      return res.status(400).json({ error: "Teacher Id is Required!" });
    }

    if(!Array.isArray(options) || !options.length){
      return res.status(400).json({ error: "Minimum 1 slot is required!" });   
    }

    if(!ObjectId.isValid(customer)){
      return res.status(400).json({ error: "Invalid Customer" });
    }


    let newOption = new OptionsModel(req.body)
    await newOption.save()
    return res.json({ 
      message:"Options Created Successfully!"
    })

  } catch (error) {
    console.log(error)
    return res.status(500).json({ error: "Something went wrong!" });
  }
}

exports.getOptions = async (req,res) => {
  try {
    const result = await OptionsModel.find().populate("customer").populate("schedules")
    return res.json({result,message:"All Options Retrieved Successfully!!!"});
  } catch (error) {
    console.log(error)
    return res.status(500).json({ error: "Something went wrong!" });
  }
}

exports.updateAnOption = async (req,res) => {

}