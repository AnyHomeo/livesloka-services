const express = require("express");
const router = express.Router();

const {
  validateSlot,
  addSlot,
  getAvailableSlots,
  getTeachers,
  // deleteSlot,
} = require("../controllers/teacher.controller");

router.post("/add/available/:id", validateSlot, addSlot);
router.get("/available/:id", getAvailableSlots);
router.get("/", getTeachers);
// router.get("/delete-slot", deleteSlot);
module.exports = router;
