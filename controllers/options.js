const CustomerModel = require("../models/Customer.model");
const TeacherModel = require("../models/Teacher.model");

exports.getTeacherSlots = async (req, res) => {
  try {
    const { subject } = req.params;
    const selectedTeachers = await TeacherModel.find({
      subject,
    })
      .select("TeacherName availableSlots scheduledSlots")
      .lean();

    return res.json({
      result: selectedTeachers,
      message: "Teachers retrieved successfully!!",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Something went wrong!" });
  }
};

exports.getOnlyDemoCustomers = async (req, res) => {
  try {
    let { select } = req.query;
    if(select) {
        select = select.split(",").join(" ");
    }
    const demoCustomers = await CustomerModel.find({
      classStatusId: "38493085684944",
    })
      .select(select)
      .lean();

    return res.json({
      message: "Demo customers retrieved successfully",
      result: demoCustomers,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Something went wrong!" });
  }
};
