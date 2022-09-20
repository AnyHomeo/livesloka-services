const VideoModel = require('../models/Videos.model');
const AdminModel = require('../models/Admin.model');

exports.getVideosByCategoryId = async (req, res) => {
  try {
    const { id } = req.params;
    const videos = await VideoModel.find({ category: id })
      .populate('assignedTo', 'username')
      .lean();
    return res.json({
      result: videos,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: 'Something went wrong!',
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
      .populate('assignedTo', 'username')
      .lean();
    return res.json({
      result: videos,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: 'Something went wrong!',
    });
  }
};

exports.uploadBulkVideos = async (req, res) => {
  try {
    let bulk = req.body;
    if (Array.isArray(bulk)) {
      const logins = await AdminModel.find({
        userId: { $in: bulk.map((file) => file.email) },
      })
        .select('_id userId')
        .lean();
      bulk = bulk.map((file) => ({
        ...file,
        id: Math.floor(Math.random() * 100000) * Number(Date.now()),
        assignedTo: logins.reduce((accumulator, login) => {
          if (login.userId === file.email) {
            accumulator.push(login._id);
          }
          return accumulator;
        }, []),
      }));
      const insertedFiles = await VideoModel.insertMany(bulk);
      return res.json({
        message: 'files inserted successfully!',
        result: insertedFiles,
      });
    } else {
      return res.status(400).json({
        error: 'Bulk files need to be an array',
        result: null,
      });
    }
  } catch (error) {
    return res.status(500).json({
      error: 'Something went wrong !',
      result: error,
    });
  }
};
