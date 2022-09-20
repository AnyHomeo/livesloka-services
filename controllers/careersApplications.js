const CareersApplications = require('../models/CareersApplications');

exports.registerInCareers = async (req, res) => {
  try {
    const { email, firstName, phone } = req.body;
    if (!email) {
      return res.status(400).json({
        error: 'Email Required',
      });
    }
    if (!firstName) {
      return res.status(400).json({
        error: 'First Name Required',
      });
    }
    if (!phone) {
      return res.status(400).json({
        error: 'Phone number is Required',
      });
    }
    let alreadyApplied = await CareersApplications.findOne({ email: email });
    if (alreadyApplied) {
      return res.status(400).json({
        error: 'Already Applied',
      });
    }
    let newCareersApplication = new CareersApplications({ ...req.body });
    await newCareersApplication.save();
    return res.json({
      message: 'Applied Successfully!',
    });
  } catch (error) {
    console.log(error);
    return res.json({
      error: 'Something went wrong',
    });
  }
};

exports.getAllApplications = async (req, res) => {
  try {
    let result = await CareersApplications.find().sort({ createdAt: -1 });
    return res.json({
      result,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: 'Something went wrong!',
    });
  }
};
