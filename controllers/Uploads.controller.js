const TeacherModel = require("../models/Teacher.model");
const CustomerModel = require("../models/Customer.model");
const Category = require("../models/Category.model");
const Schedule = require("../models/Scheduler.model");
const Attendence = require("../models/Attendance");
const Uploads = require("../models/uploads.model");
const uploadsModel = require("../models/uploads.model");

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
    await Uploads.insertMany(req.body);
    return res.json({
      message: "Material Uploaded Successfully !",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: "Error in uploading Material !",
    });
  }
};

exports.GetStudentsMaterial = async (req, res) => {
  try {
    let stdId = req.params.id;
    let stdmatdata = await CustomerModel.find({
      email: stdId,
    }).populate("materials");
    let mat = [];
    stdmatdata.forEach((el) => {
      mat.push(...el.materials);
    });
    return res.status(200).json({
      message: "Fetched Succesfully",
      mat,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error,
    });
  }
};

exports.assignMaterial = async (req, res) => {
  let { scheduleId, materialId } = req.body;
  let scheduleData = await Schedule.find({
    _id: scheduleId,
  });
  let studentsIds = scheduleData[0].students;
  CustomerModel.updateMany(
    {
      _id: {
        $in: studentsIds,
      },
    },
    {
      $push: {
        materials: materialId,
      },
    }
  )
    .then((data) => {
      return res.json({
        message: "Material Assigned Successfully !",
      });
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).json({
        error: "problem in assigning the material",
      });
    });
};

exports.getMaterialsByTeacherId = async (req, res) => {
  try {
    const { teacherId } = req.params;
    let uploadsByTeacher = await Uploads.find({
      teacherId,
    });
    let uploadIds = uploadsByTeacher.map((upload) => upload._id);
    let customersWithThisTeacherMaterials = await CustomerModel.find({
      materials: {
        $in: uploadIds,
      },
    }).select("materials firstName");
    let finalMaterials = [];
    uploadsByTeacher.forEach((upload) => {
      let uploadWithUsers = {
        ...upload,
        students: [],
      };
      customersWithThisTeacherMaterials.forEach((customer) => {
        if (customer.materials.includes(upload._id)) {
          uploadWithUsers.students.push(customer);
        }
      });
      finalMaterials.push(uploadWithUsers);
    });
    return res.json({
      result: finalMaterials,
      message: "All Materials fetched successfully !",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: "Error in retrieving data!",
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
