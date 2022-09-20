const express = require('express');
const router = express.Router();
const {
  registerInCareers,
  getAllApplications,
} = require('../controllers/careersApplications');

router.post('/', registerInCareers);
router.get('/', getAllApplications);
module.exports = router;
