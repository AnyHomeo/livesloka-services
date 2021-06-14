const AdminModel = require('../models/Admin.model');
const AdMessagesModel = require('../models/AdMessage.model');

exports.getMessagesByEmail = async (req, res) => {
	try {
		const { email } = req.params;
		const admin = await AdminModel.findOne({
			userId: email,
		})
			.select('_id')
			.lean();
		let allMessages = await AdMessagesModel.find({
			$or: [
				{
					adminIds: {
						$in: [admin._id],
					},
				},
				{ isForAll: true },
			],
		}).lean();
		return res.json({
			result: allMessages,
			messages: 'Retrieved Messages Successfully!',
		});
	} catch (error) {
		console.log(error);
		return res.json({
			error: 'Something went wrong!',
		});
	}
};
