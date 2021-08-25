require('dotenv').config();
const FinalizedSalariesModel = require('../models/finalizedSalaries');
const AgentModel = require('../models/Agent.model');
var twilio = require('twilio');
var client = new twilio(process.env.TWILIO_ID, process.env.TWILIO_TOKEN);

exports.sendOtpsForSalarysFinalisation = async (req, res) => {
	try {
		const { month, year } = req.body;
		const isAlreadyFinalized = await FinalizedSalariesModel.findOne({
			month,
			year,
		});
		if (isAlreadyFinalized && isAlreadyFinalized.finalizedSalaries) {
			return res.status(400).json({ error: 'Already finalized!' });
		} else {
			let agentsToFinalize = await AgentModel.find({
				needToFinalizeSalaries: true,
			}).select('_id phoneNumber AgentName');
			let otpsToValidate = await Promise.all(
				agentsToFinalize.map(async (agent) => {
					let otp = Math.floor(1000 + Math.random() * 9000);
					await client.messages.create({
						body: `Live Sloka: Your OTP to Finalize Salaries is ${otp}`,
						to: agent.phoneNumber,
						from: process.env.TWILIO_NUMBER,
					});
					return {
						agentId: agent._id,
						otp,
						name:agent.AgentName
					};
				})
			);
            if(isAlreadyFinalized){
                isAlreadyFinalized.otpsToValidate = otpsToValidate
                await isAlreadyFinalized.save()
                return res.json({
                    message:"OTPs Sent Successfully!",
					result:otpsToValidate.map(otp => ({
						...otp,
						otp:undefined
					}))
                })
            } else {
                let newFinalizedSalaries = new FinalizedSalariesModel({
                    month,
                    year,
                    otpsToValidate
                })
                await newFinalizedSalaries.save();
                return res.json({
                    message:"OTPs Sent Successfully!",
					result:otpsToValidate.map(otp => ({
						...otp,
						otp:undefined
					}))
                })
            }
		}
	} catch (error) {
		console.log(error);
		return res.status(500).json({ error: 'Something went wrong!' });
	}
};
