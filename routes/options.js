const express = require('express');
const {
  getOnlyDemoCustomers,
  getTeacherSlots,
  getOptionByCustomer,
  getOptionsByTeacherId,
  postAnOption,
  getOptions,
  getAnOption,
  updateAnOption,
  deleteAnOption,
  manuallyMakeOptionsToSchedule,
} = require('../controllers/options');
const router = express.Router();

router.post('/', postAnOption);
router.get('/', getOptions);
router.get('/:id', getAnOption);
router.get('/customer/:customerId', getOptionByCustomer);
router.put('/:id', updateAnOption);
router.get('/demo/students', getOnlyDemoCustomers);
router.get('/teacher/:teacherId', getOptionsByTeacherId);
router.get('/teacher/slots/:teacherId', getTeacherSlots);
router.delete('/:optionId', deleteAnOption);
router.patch('/manual/:optionsId', manuallyMakeOptionsToSchedule);

module.exports = router;
