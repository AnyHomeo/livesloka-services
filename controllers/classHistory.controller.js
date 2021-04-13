const CustomerModel = require("../models/Customer.model");
const ClassHistoryModel = require("../models/ClassHistory.model");

exports.updateClassesPaid = async (req, res) => {
  try {
    let { _id, comment, numberOfClassesBought } = req.body;
    let customer = await CustomerModel.findById(_id).select(
      "numberOfClassesBought"
    );
    let previousValue = customer.numberOfClassesBought;
    if (previousValue !== numberOfClassesBought) {
      customer.numberOfClassesBought = numberOfClassesBought;
      await customer.save();
      let newHistory = new ClassHistoryModel({
        customerId: _id,
        previousValue,
        nextValue: numberOfClassesBought,
        comment,
      });
      await newHistory.save();
      
    } 
    return res.json({
        message: "updated successfully!",
      });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: "error while updating",
    });
  }
};
