const TeacherModel = require("../models/Teacher.model");
const days = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];
exports.validateSlot = (req, res, next) => {
  if (!req.body.slot) {
    return res.status(400).json({ stage: 1, error: "Invalid Entry" });
  } else {
    let arr = req.body.slot.split("-");
    if (!days.includes(arr[0].trim())) {
      console.log(arr[0], arr[0].length);
      return res.status(400).json({ stage: 2, error: "Invalid Entry" });
    } else if (
      !(!isNaN(arr[1].split(":")[0]) && parseInt(arr[1].split(":")[0]) <= 12)
    ) {
      return res.status(400).json({ stage: 3, error: "Invalid Entry" });
    } else if (
      !(
        arr[2].split(":")[1].startsWith("30") ||
        arr[2].split(":")[1].startsWith("00")
      )
    ) {
      return res.status(400).json({ stage: 4, error: "Invalid Entry" });
    } else {
      let { slot } = req.body;
      req.body.slot =
        slot.split("-")[0].trim() +
        "-" +
        slot.split("-")[1].trim() +
        "-" +
        slot.split("-")[2].trim();
      next();
    }
  }
};

exports.addSlot = (req, res) => {
  const { id } = req.params;
  TeacherModel.findOne({
    id,
  }).then((data) => {
    if (data.availableSlots) {
      if (!data.availableSlots.includes(req.body.slot)) {
        data.availableSlots.push(req.body.slot);
      } else {
        return res.status(400).json({
          error: "Selected Slot already Added",
        });
      }
      data.save((err, docs) => {
        if (err) {
          return res.status(400).json({
            error: "internal server error",
          });
        } else {
          return res.json({
            message: "Slot added successfully",
          });
        }
      });
    } else {
      data.availableSlots = [req.body.slot];
      data.save((err, docs) => {
        if (err) {
          return res.status(400).json({
            error: "internal server error",
          });
        } else {
          return res.json({
            message: "Slot added successfully",
          });
        }
      });
    }
  });
};

exports.getAvailableSlots = (req, res) => {
  const { day } = req.query;
  const { id } = req.params;
  if (days.includes(day)) {
    TeacherModel.findOne({ id })
      .select("availableSlots")
      .then((data) => {
        let arr = [];
        if (data.availableSlots) {
          data.availableSlots.forEach((slot) => {
            if (slot.startsWith(day)) {
              let slotArr = slot.split("-");
              arr.push(slotArr[1] + "-" + slotArr[2]);
            }
          });
          return res.status(200).json({
            message: "slots retrieved successfully",
            result: arr,
          });
        } else {
          data.availableSlots = [];
          data.save((err, docs) => {
            if (err) {
              return res.status(500).json({
                error: "internal server error",
              });
            }
            return res.status(200).json({
              message: "Slots retrieved successfully",
              result: [],
            });
          });
        }
      })
      .catch((err) => {
        return res.status(400).json({
          error: "error in retrieving data",
        });
      });
  } else {
    return res.status(400).json({
      error: "invalid Day!",
    });
  }
};

exports.getTeachers = (req, res) => {
  let { params } = req.query;
  params = params.split(",").join(" ");
  TeacherModel.find()
    .select(params)
    .then((result) => {
      return res.status(200).json({
        message: "Teachers retrieved successfully",
        result,
      });
    })
    .catch((err) => {
      return res.status(500).json({
        error: "error in retrieving",
      });
    });
};
