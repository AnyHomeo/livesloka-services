const TeacherModel = require("../models/Teacher.model");
const CustomerModel = require("../models/Customer.model");
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
    if (data.availableSlots && data.scheduledSlots) {
      if (
        !data.availableSlots.includes(req.body.slot) ||
        data.scheduledSlots.includes(req.body.slot)
      ) {
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
  let { day } = req.query;
  const { id } = req.params;
  day = day.split(",");
  TeacherModel.findOne({ id })
    .select("availableSlots")
    .then((data) => {
      let arr = [];
      if (data.availableSlots) {
        data.availableSlots.forEach((slot) => {
          day.forEach((oneDay) => {
            if (slot.startsWith(oneDay)) {
              arr.push(slot);
            }
          });
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

exports.deleteSlot = (req, res) => {
  const { id } = req.params;
  const { slot } = req.body;
  TeacherModel.findOne({ id })
    .select("availableSlots")
    .then((data) => {
      if (data && data.availableSlots) {
        let index = data.availableSlots.indexOf(slot);
        data.availableSlots.splice(index, 1);
        data.save((err, docs) => {
          console.log(docs, err);
          return res.status(200).json({
            message: "deleted successfully",
            result: docs.availableSlots,
          });
        });
      }
    })
    .catch((err) => {
      console.log(err);
      return res.status(400).json({
        error: "error in retrieving teacehers data",
      });
    });
};

// exports.getAllTEachers = (req, res) => {

//   CustomerModel.find({})
//     .then((students) => {
//       TeacherModel.find({})
//         .then((teachers) => {
//           let finalresult = [];

//           let studentslen = students.length;
//           let teachersLen = teachers.length;
//           for (i = 0; i < teachersLen; i++) {
//             let currentTeacher = teachers[i];

//             for (j = 0; j < studentslen; j++) {
//               let currentStud = students[j];
//               let obj = {};
//               if (currentTeacher.id === currentStud.teacherId) {
//                 obj.TeacherName = currentTeacher.TeacherName;
//                 obj.StudentId = currentStud._id;
//                 obj.studentName = currentStud.firstName;
//                 obj.amount = currentStud.proposedAmount;
//                 console.log(obj);
//                 finalresult.push(obj);
//                 console.log(finalresult);

//               }
//             }
//           }

//         })
//         .catch((err) => { console.log(err) })
//     })
//     .catch((err) => {
//       console.log(err);
//     })

// }


exports.getAllTEachers = (req, res) => {

  CustomerModel.find({})
    .then((students) => {
      TeacherModel.find({})
        .then((teachers) => {
          let finalresult = [];
          let obje = {};
          let studentslen = students.length;
          let teachersLen = teachers.length;
          for (i = 0; i < teachersLen; i++) {
            let currentTeacher = teachers[i];
            obje[currentTeacher.TeacherName] = [];
            console.log(currentTeacher.TeacherName)
            for (j = 0; j < studentslen; j++) {
              let currentStud = students[j];
              let obj = {};
              if (currentTeacher.id === currentStud.teacherId) {
                // obj.TeacherName = currentTeacher.TeacherName;
                obj.StudentId = currentStud._id;
                obj.studentName = currentStud.firstName;
                obj.amount = currentStud.proposedAmount;
                obje[currentTeacher.TeacherName].push(obj);
              }
            }
          }
          //console.log(obje);
          return res.status(200).json({ message: "TeachersStudetsFetched successfully", result: obje });
        })
        .catch((err) => { return res.status(400).json({ message: "error occurered ", err }); })
    })
    .catch((err) => {
      console.log(err);
    })

}
