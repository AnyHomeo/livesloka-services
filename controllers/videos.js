const VideoModel = require("../models/Videos.model");

exports.getVideosByCategoryId = async (req, res) => {
    try {
        const { id } = req.params;
        const videos= await VideoModel.find({category:id}).populate("assignedTo","username").lean()
        return res.json({
            result:videos
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            error:"Something went wrong!"
        })
    }
}