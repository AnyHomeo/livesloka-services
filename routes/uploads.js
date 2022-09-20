const express = require('express');
const router = express.Router();

const {
  GetTeacherSchedules,
  PostUpload,
  GetStudentMaterials,
  assignMaterial,
  getMaterialsByTeacherId,
  deleteMaterial,
  removeClassFromMaterialAccess,
} = require('../controllers/Uploads.controller');

router.get('/schedules/:id', GetTeacherSchedules);
router.post('/material', PostUpload);
router.get('/student/:id', GetStudentMaterials);
router.post('/assign', assignMaterial);
router.get('/teacher/:teacherId', getMaterialsByTeacherId);
router.delete('/delete/:materialId', deleteMaterial);
router.delete('/delete/:materialId/:scheduleId', removeClassFromMaterialAccess);

module.exports = router;
