const express = require("express");
const router = express.Router();

const {
  validateSlot,
  addSlot,
  getAvailableSlots,
  getTeachers,
  deleteSlot,
  getOccupancyDashboardData,
  getAllDaysSlots,
} = require("../controllers/teacher.controller");

router.post("/add/available/:id", validateSlot, addSlot);
router.get("/available/:id", getAvailableSlots);
router.get("/", getTeachers);
router.post("/delete/slot/:id", validateSlot, deleteSlot);
router.get("/occupancy", getOccupancyDashboardData);
router.get("/all/slots/:id", getAllDaysSlots);
module.exports = router;
