const CustomerModel = require("../models/Customer.model");
const ClassHistoryModel = require("../models/ClassHistory.model");
const SchedulerModel = require("../models/Scheduler.model");

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

exports.getHistoryById = async (req,res) => {
  try {
    const { email } = req.params;
    let allCustomers = await CustomerModel.find({email}).select("_id").lean()
    allCustomers = allCustomers.map(customer => customer._id)
      let schedulesOfCustomers = await SchedulerModel.find({
        students:{
          $in: allCustomers
        },
        isDeleted:{
          $ne:true
        }
      }).populate("subject","subjectName").select("subject students");
      let allHistory = await ClassHistoryModel.find({
        customerId:{
          $in:allCustomers
        }
      })
      let result = schedulesOfCustomers.map(schedule => {
        let customerId = allCustomers.filter(customer => schedule.students.some(student => student.equals(customer)))[0]
        console.log(customerId)
        return {
          history:allHistory.filter(history => history.customerId.equals(customerId)),
          subject:schedule.subject.subjectName
        }
      })
      return res.json({
        result
      })
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      error:"Error in retrieving the History"
    })
  }
}
