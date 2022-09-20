const express = require('express');
const {
  createPlans,
  getPlans,
  updatePlan,
  deletePlan,
  getSinglePlan,
} = require('../controllers/plan');
const router = express.Router();

router.post('/', createPlans);
router.get('/', getPlans);
router.get('/:planId', getSinglePlan);
router.put('/:planId', updatePlan);
router.delete('/:planId', deletePlan);
module.exports = router;
