const VideoModel = require("../models/Videos.model");
const AdminModel = require("../models/Admin.model");

exports.getVideosByCategoryId = async (req, res) => {
  try {
    const { id } = req.params;
    const videos = await VideoModel.find({ category: id })
      .populate("assignedTo", "username")
      .lean();
    return res.json({
      result: videos,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: "Something went wrong!",
    });
  }
};

exports.getVideosByAssignedToId = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await AdminModel.findOne({ userId });
    const videos = await VideoModel.find({
      $or: [{ isPublic: true }, { assignedTo: { $in: [user._id] } }],
    })
      .populate("assignedTo", "username")
      .lean();
      return res.json({
        result: videos,
      });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: "Something went wrong!",
    });
  }
};
