const ReviewSchema = require("../models/Reviews.modal");
module.exports.createReview = async (req, res) => {
  try {
    const reviews = new ReviewSchema(req.body);

    const data = await reviews.save();

    return res.status(201).json({
      message: "submitted Successfully",
      result: data,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

module.exports.getReview = async (req, res) => {
  const { customerId, scheduleId } = req.params;
  try {
    const data = await ReviewSchema.findOne({ customerId, scheduleId });
    return res.status(200).json({
      message: "Retrived Successfully",
      result: data,
    });
  } catch (error) {
    return res.status(400).json({
      message: "Not found",
    });
  }
};

module.exports.deleteReview = async (req, res) => {
  const { _id } = req.params;
  try {
    const data = await ReviewSchema.deleteOne({ _id });
    return res.status(200).json({
      message: "Deleted Successfully",
      result: data,
    });
  } catch (error) {
    return res.status(400).json({
      message: "Not found",
    });
  }
};

module.exports.updateReview = async (req, res) => {
  const { _id } = req.params;
  try {
    const data = await ReviewSchema.findOneAndUpdate({ _id }, req.body);

    return res.status(200).json({
      message: "Updated Successfully",
      result: data,
    });
  } catch (error) {
    return res.status(400).json({
      message: "Not found",
    });
  }
};
