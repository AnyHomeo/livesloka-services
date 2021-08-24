const express = require("express");
const { getOnlyDemoCustomers, getTeacherSlots, postAnOption, getOptions,getAnOption, updateAnOption,deleteAnOption } = require("../controllers/options");
const router = express.Router();

router.post('/',postAnOption);
router.get('/',getOptions);
router.get('/:id',getAnOption);
router.put('/:id',updateAnOption);
router.get('/demo/students',getOnlyDemoCustomers);
router.get('/teacher/slots/:teacherId',getTeacherSlots);
router.delete('/:optionId',deleteAnOption);

module.exports = router;