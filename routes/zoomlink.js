const express = require('express');
const router = express.Router();
const { zoomlink, zoomDetails } = require('../controllers/zoomlink.controller');

router.post('/getzoomlink', zoomlink);
router.get('/getzoomdetails/:id', zoomDetails);
module.exports = router;
