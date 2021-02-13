const TeacherModel = require("../models/Teacher.model");
const CustomerModel = require("../models/Customer.model");
const Category = require("../models/Category.model");
const Schedule = require("../models/Scheduler.model");
const Attendence = require("../models/Attendance");
const Uploads = require("../models/uploads.model");
const uploadsModel = require("../models/uploads.model");
const SchedulerModel = require("../models/Scheduler.model");

exports.GetTeacherSchedules = async (req, res) => {
  let teacherId = req.params.id;
  let allSchds = await Schedule.find({
    teacher: teacherId,
  });
  ActiveSchds = allSchds.filter((el) => el.isDeleted === false);
  let obj = [];
  ActiveSchds.forEach((el) => {
    eachObj = {};
    eachObj["ScheduleId"] = el._id;
    eachObj["ClassName"] = el.className;
    obj.push(eachObj);
  });
  try {
    return res.status(200).json({
      message: "Teacher Scheduled Fetched",
      obj,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error,
    });
  }
};

exports.PostUpload = async (req, res) => {
  try {
    const upload = new Uploads(req.body);
    upload
      .save()
      .then((data) => {
        console.log(upload);
        return res.json({
          message: "Material Uploaded Successfully !",
        });
      })
      .catch((error) => {
        console.log(error);
        return res.status(500).json({
          error: "error in saving!!",
        });
      });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: "Error in uploading Material !",
    });
  }
};

exports.GetStudentMaterials = async (req, res) => {
  try {
    const { id } = req.params;
    let schedule = await SchedulerModel.findById(id).select("materials");
    return res.json({
      result: schedule.materials,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: "Error in retrieving material!",
    });
  }
};

exports.assignMaterial = async (req, res) => {
  try {
    let { scheduleId, materialId } = req.body;
    let scheduleData = await Schedule.findOne({
      _id: scheduleId,
    });
    if (!scheduleData.materials.includes(materialId)) {
      scheduleData.materials.push(materialId);
    }
    await scheduleData.save();
    return res.json({
      message: "Material Assigned Successfully!!",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: "Error in assigning Materials",
    });
  }
};

exports.getMaterialsByTeacherId = async (req, res) => {
  try {
    const { teacherId } = req.params;
    let materialsByTeacher = await Uploads.find({
      teacherId,
    }).lean();
    let materialIds = materialsByTeacher.map((material) => material._id);
    let schedulesWithTheseMaterials = await SchedulerModel.find({
      materials: {
        $in: materialIds,
      },
    })
      .select("students materials className")
      .populate("students", "firstName")
      .lean();
    let finalMaterials = [];
    materialsByTeacher.forEach((material) => {
      let materialData = { ...material, classes: [] };
      schedulesWithTheseMaterials.forEach((schedule) => {
        schedule.materials = schedule.materials.map((material) =>
          material.toString()
        );
        if (schedule.materials.includes(material._id.toString())) {
          materialData.classes.push(schedule);
        }
      });
      finalMaterials.push(materialData);
    });
    return res.json({
      result: finalMaterials,
      message: "Materials Retrieved Successfully!",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: "error in retrieving materials",
    });
  }
};

exports.deleteMaterial = async (req, res) => {
  const materialId = req.params;
  await uploadsModel.deleteOne({
    _id: materialId,
  });
  let customersWithThisMaterial = await CustomerModel.find({
    materials: materialId,
  }).select("materials");
  customersWithThisMaterial.forEach(async (customer) => {
    if (
      Array.isArray(customer.materials) &&
      customer.materials.includes(materialId)
    ) {
      let index = customer.materials.indexOf(materialId);
      if (index !== -1) {
        customer.materials.splice(index, 1);
      }
    }
    await customer.save();
  });
};
