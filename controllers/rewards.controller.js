const AdminModel = require("../models/Admin.model");
const CustomerModel = require("../models/Customer.model");
const RewardsModel = require("../models/Rewards.model");
const SubjectModel = require("../models/Subject.model");

exports.getRewardsHistoryByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { redeems } = req.query;
    const admin = await AdminModel.findOne({ userId }).lean();
    if (redeems) {
      const redeemData = await RewardsModel.find({ login: admin._id }).lean();
      return res.json({
        message: "Rewards retrieved successfully",
        result: {
          rewards: admin?.rewards,
          redeems: redeemData,
        },
      });
    }
    return res.json({
      message: "Rewards retrieved successfully",
      result: {
        rewards: admin?.rewards,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      result: error,
      message: "Something went wrong",
    });
  }
};

exports.redeemRewards = async (req, res) => {
  try {
    const { userId, subjectId, count } = req.body;
    const admin = await AdminModel.findOne({ userId });
    const customer = await CustomerModel.findOne({ email: userId }).lean();
    const subject = await SubjectModel.findOne({ id: subjectId }).lean();

    console.log(subjectId);

    delete customer.requestedSubjects;
    delete customer.numberOfClassesBought;
    delete customer.classStatusId;
    delete customer.createdAt;
    delete customer.teacherId;
    delete customer.className;
    delete customer.proposedAmount;
    delete customer.paidTill;
    delete customer.scheduleDescription;
    delete customer.meetingLink;
    delete customer._id;

    const newCustomer = new CustomerModel({
      ...customer,
      subjectId,
      isRedeemedCustomer: true,
    });
    await newCustomer.save();
    let present = admin.rewards - count * subject.rewards;
    const newRewardRedeem = new RewardsModel({
      prev: admin.rewards,
      present,
      message: `Redeemed ${count} ${subject.subjectName} classes`,
      login: admin._id,
    });
    await newRewardRedeem.save();

    admin.rewards = present;
    await admin.save();

    return res.json({
      message: `Redeemed ${count} ${subject.subjectName} classes`,
      result: null,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      result: error,
      message: "Something went wrong",
    });
  }
};