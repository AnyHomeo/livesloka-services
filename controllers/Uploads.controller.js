const Schedule = require('../models/Scheduler.model');
const Uploads = require('../models/uploads.model');
const SchedulerModel = require('../models/Scheduler.model');
const moment = require('moment');

exports.GetTeacherSchedules = async (req, res) => {
  let teacherId = req.params.id;
  let allSchds = await Schedule.find({
    teacher: teacherId,
  });
  ActiveSchds = allSchds.filter((el) => el.isDeleted === false);
  let obj = [];
  ActiveSchds.forEach((el) => {
    eachObj = {};
    eachObj['ScheduleId'] = el._id;
    eachObj['ClassName'] = el.className;
    obj.push(eachObj);
  });
  try {
    return res.status(200).json({
      message: 'Teacher Scheduled Fetched',
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
    await upload.save();
    return res.json({
      message: 'Material Uploaded Successfully !',
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: 'Error in uploading Material !',
    });
  }
};

exports.GetStudentMaterials = async (req, res) => {
  try {
    const { id } = req.params;
    let schedule = await SchedulerModel.findById(id)
      .populate('materials')
      .select('materials');
    return res.json({
      result: schedule ? schedule.materials : [],
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: 'Error in retrieving material!',
    });
  }
};

exports.assignMaterial = async (req, res) => {
  try {
    let { scheduleId, materialId } = req.body;
    let scheduleData = await SchedulerModel.findOne({
      _id: scheduleId,
    });
    if (!scheduleData.materials.includes(materialId)) {
      scheduleData.materials.push(materialId);
    }
    if (typeof scheduleData.lastTimeJoinedClass !== 'object') {
      if (typeof scheduleData.lastTimeJoinedClass === 'string') {
        let strings = scheduleData.lastTimeJoinedClass.split('-');
        scheduleData.lastTimeJoinedClass = new Date(
          strings[2],
          strings[1],
          strings[0]
        );
      } else {
        scheduleData.lastTimeJoinedClass = new Date(
          moment().subtract(1, 'days').format()
        );
      }
    }
    await scheduleData.save();
    return res.json({
      message: 'Material Assigned Successfully!!',
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: 'Error in assigning Materials',
    });
  }
};

exports.getMaterialsByTeacherId = async (req, res) => {
  try {
    const { teacherId } = req.params;
    let materialsByTeacher = await Uploads.find({
      teacherId,
      isDeleted: {
        $ne: true,
      },
    }).lean();
    let materialIds = materialsByTeacher.map((material) => material._id);
    let schedulesWithTheseMaterials = await SchedulerModel.find({
      materials: {
        $in: materialIds,
      },
    })
      .select('students materials className')
      .populate('students', 'firstName')
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
      message: 'Materials Retrieved Successfully!',
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: 'error in retrieving materials',
    });
  }
};

exports.deleteMaterial = async (req, res) => {
  try {
    const { materialId } = req.params;
    let material = await Uploads.findById(materialId);
    material.isDeleted = true;
    await material.save();
    let schedulesWithThisMaterial = await SchedulerModel.find({
      materials: {
        $in: [material._id],
      },
    });
    schedulesWithThisMaterial.forEach(async (schedule) => {
      if (schedule.materials.includes(materialId)) {
        let index = schedule.materials.indexOf(materialId);
        schedule.materials.splice(index, 1);
      }
      if (typeof schedule.lastTimeJoinedClass !== 'object') {
        if (typeof schedule.lastTimeJoinedClass === 'string') {
          let strings = schedule.lastTimeJoinedClass.split('-');
          schedule.lastTimeJoinedClass = new Date(
            strings[2],
            strings[1],
            strings[0]
          );
        } else {
          schedule.lastTimeJoinedClass = new Date(
            moment().subtract(1, 'days').format()
          );
        }
      }
      await schedule.save();
    });
    return res.json({
      message: 'Material Deleted Successfully !',
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: 'Something wrong in deleting Material',
    });
  }
};

exports.removeClassFromMaterialAccess = async (req, res) => {
  try {
    const { materialId, scheduleId } = req.params;
    const schedule = await SchedulerModel.findById(scheduleId);
    if (schedule) {
      let materialIndex = schedule.materials.indexOf(materialId);
      if (materialIndex !== -1) {
        schedule.materials.splice(materialIndex, 1);
        schedule.lastTimeJoinedClass = undefined;
        await schedule.save();
      }
    }
    return res.json({
      message: 'Removed class Successfully !',
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: 'Something went Wrong',
    });
  }
};
