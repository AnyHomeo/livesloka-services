const express = require('express');
const router = express.Router();

const {
  getVideosByCategoryId,
  getVideosByAssignedToId,
  uploadBulkVideos,
} = require('../controllers/videos');

router.get('/category/:id', getVideosByCategoryId);
router.get('/customer/:userId', getVideosByAssignedToId);
router.post('/bulk', uploadBulkVideos);

module.exports = router;
