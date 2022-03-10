const SchedulerModel = require("../models/Scheduler.model");
const TeacherModel = require("../models/Teacher.model");
const days = require("../config/days.json");
const hours = require("../config/hours.json");

const colors = [
  "#f1c40f",
  "#e67e22",
  "#9b59b6",
  "#273c75",
  "#40739e",
  "#82589F",
];

exports.getTeachersCategoried = async (req, res) => {
  try {
    let allTeachers = await TeacherModel.find()
      .select("id TeacherName category")
      .populate("categoryOfTeacher")
      .lean();
    allTeachers = allTeachers.reduce((accumulator, teacher) => {
      if (teacher.categoryOfTeacher && teacher.categoryOfTeacher.categoryName) {
        let category = teacher.categoryOfTeacher.categoryName;
        if (!accumulator[category]) {
          accumulator[category] = [
            { ...teacher, categoryOfTeacher: undefined },
          ];
        } else {
          accumulator[category].push({
            ...teacher,
            categoryOfTeacher: undefined,
          });
        }
      }
      return accumulator;
    }, {});

    return res.json({ result: allTeachers });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Something went wrong!" });
  }
};

exports.getTeacherSchedules = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { web } = req.query;
    let teacher = await TeacherModel.findOne({ id: teacherId });
    if (teacher) {
      let schedulesOfTeacher = await SchedulerModel.find({
        teacher: teacher.id,
        isDeleted: { $ne: true },
      })
        .populate("students", "firstName lastName")
        .lean();
      schedulesOfTeacher = schedulesOfTeacher.map((schedule, i) => ({
        ...schedule,
      }));

      let finalSchedules = [];
      if (!web) {
        finalSchedules = schedulesOfTeacher.reduce(
          (accumulator, schedule, i) => {
            schedule.color = colors[i % colors.length];
            const { monday, tuesday, wednesday, thursday, friday, saturday } =
              schedule.slots;
            let allSlots = [
              ...monday,
              ...tuesday,
              ...wednesday,
              ...thursday,
              ...friday,
              ...saturday,
            ];
            schedule.slots = undefined;
            allSlots.forEach((slot) => {
              accumulator[slot] = schedule;
            });
            return accumulator;
          },
          {}
        );
      } else {
        days.forEach((day) => {
          finalSchedules.push({
            day,
            schedules: hours.reduce((schedules, hour, i) => {
              let scheduleIndex = schedulesOfTeacher.findIndex((schedule) =>
                schedule.slots[day.toLowerCase()].includes(
                  `${day}-${hour}-${hours[i+1]}`
                )
              );
              if (scheduleIndex !== -1) {
                schedules.push({
                  hour,
                  schedule: schedulesOfTeacher[scheduleIndex],
                });
              }
              return schedules;
            }, []),
          });
        });
      }

      return res.json({
        result: {
          schedules: finalSchedules,
          teacher,
        },
      });
    } else {
      return res.status(400).json({ error: "Invalid teacher Id" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Something went wrong!" });
  }
};
