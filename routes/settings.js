const express = require('express');
const router = express.Router();
const {
  getSettings,
  updateSettings,
} = require('../controllers/settings.controller');

router.get('/:id', getSettings);
router.post('/:id', updateSettings);

module.exports = router;
