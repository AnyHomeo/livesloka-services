const express = require("express");
const router = express.Router();

const {
  validateSlot,
  addSlot,
  getAvailableSlots,
  getTeachers,
  deleteSlot,
  getOccupancyDashboardData,
} = require("../controllers/teacher.controller");

router.post("/add/available/:id", validateSlot, addSlot);
router.get("/available/:id", getAvailableSlots);
router.get("/", getTeachers);
router.post("/delete/slot/:id", validateSlot, deleteSlot);
router.get("/occupancy", getOccupancyDashboardData);
module.exports = router;
