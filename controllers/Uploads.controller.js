const TeacherModel = require("../models/Teacher.model");
const CustomerModel = require("../models/Customer.model");
const Category = require("../models/Category.model");
const Schedule = require("../models/Scheduler.model");
const Attendence = require("../models/Attendance");
const Uploads = require("../models/uploads.model");

exports.GetTeacherSchedules = async (req, res) => {
    let teacherId = req.params.id;
    let allSchds = await Schedule.find({ teacher: teacherId })
    console.log(allSchds.length)
    ActiveSchds = allSchds.filter(el => el.isDeleted === false)
    console.log(ActiveSchds.length);
    let obj = [];
    ActiveSchds.forEach(el => {
        eachObj = {};
        eachObj['ScheduleId'] = el._id;
        eachObj['ClassName'] = el.className;
        obj.push(eachObj);
    })
    console.log(obj);
    try {
        return res.status(200).json({ message: "Teacher Scheduled Fetched", obj });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error });
    }

}

exports.PostUpload = async (req, res) => {
    console.log(req.body);
}



