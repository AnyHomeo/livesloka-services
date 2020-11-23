const express = require("express");
const router = express.Router();

const {
  validateSlot,
  addSlot,
  getAvailableSlots,
  getTeachers,
} = require("../controllers/teacher.controller");

router.post("/add/available/:id", validateSlot, addSlot);
router.get("/available/:id", getAvailableSlots);
router.get("/", getTeachers);
module.exports = router;
