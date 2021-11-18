const { asyncForEach } = require("../config/helper");
const ObjectId = require("mongoose").Types.ObjectId;
const Product = require("../models/Product.model");
const Plan = require("../models/Plan.model");
const CurrencyModel = require("../models/Currency.model")
const { createStripePlan, updateStripePlan } = require("./stripe");
const Customer = require("../models/Customer.model");

exports.createPlans =async (req,res) => {
  try {
    const { name, description, amount, interval, intervalCount, products,currency, isSubscription,list } =
      req.body;

      if (
      !Array.isArray(products) ||
      !products.every((product) => ObjectId.isValid(product))
    ) {
      return res.status(400).json({ error: "Invalid Product IdS" });
    }

    if(!currency || !ObjectId.isValid(currency)){
      return res.status(400).json({ error: "Invalid Currency" });
    }

    const currencyData = await CurrencyModel.findById(currency)
    if(!currencyData || !currencyData.currencyName){
      return res.status(400).json({ error: "Currency doesn't exist" });
    }

    let plans = products.map((product) => ({
      name,
      description,
      amount,
      interval,
      intervalCount,
      currency,
      product,
      list,
      isSubscription
    }));

    if(isSubscription){
      await asyncForEach(plans, async (plan, i) => {
        let insertedStripePlan = await createStripePlan({
          currency: currencyData.currencyName.toLowerCase(),
          unit_amount: parseFloat(amount) * 100,
          product: plan.product,
          metadata: {
            name,
            description,
          },
          recurring: {
            interval,
            interval_count:intervalCount,
          },
        });
        if (insertedStripePlan.type === "success") {
          plans[i].stripe = insertedStripePlan.result.id;
        } else {
          console.log(insertedStripePlan)
        }
      });
  
      plans = plans.filter((plan) => !!plan.stripe);  
    }

    let insertedPlans = await Plan.insertMany(plans);
    return res.json({
      message: "Plans inserted successfully!",
      result: insertedPlans,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: "Problem in creating a plan",
    });
  }
};

exports.getPlans = async (req, res) => {
  try {
    let { customerId, productId } = req.query;
    if (customerId) {
      if (ObjectId.isValid(customerId)) {
        const customer = await Customer.findById(customerId)
          .select("subjectId subject proposedCurrencyId isSubscription discount")
          .populate("subject")
          .populate("currency")
          .lean();
        if (customer) {
          if (customer.subjectId && customer.subject && customer.subject._id) {
            const product = await Product.findOne({
              subject: customer.subject._id,
              isDeleted:false
            });
            if (!product) {
              return res.status(400).json({
                error: "No products for Assigned subject!",
              });
            }
            if(!customer.currency){
              return res.status(400).json({
                error: "Currency Not added to the customer!",
              });
            }
            const plans = await Plan.find({
              product: product._id,
              currency:customer.currency._id,
              isDeleted: false,
              isSubscription: !!customer.isSubscription
            }).populate("currency");

            if(plans.length){
              return res.json({
                result: plans,
                discount:customer.discount,
                message: "Plans retrieved successfully!",
              });
            } else {
              return res.status(400).json({
                error: "Plans not available!",
              });
            }
          } else {
            return res.status(400).json({
              error: "Subject Not assigned!",
            });
          }
        } else {
          return res.status(400).json({
            error: "Invalid Customer",
          });
        }
      } else {
        return res.status(400).json({
          error: "Invalid Customer",
        });
      }
    } else if (productId) {
      const plans = await Plan.find({ product: productId, isDeleted: false }).populate("currency");
      return res.json({
        result: plans,
        message: "Plans retrieved successfully!",
      });
    } else {
      return res.status(400).json({
        error: "Valid Product Id or Customer Id required",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: "Problem in Retrieving plans",
    });
  }
};

exports.getSinglePlan = async (req,res) => {
  try {
    const { planId } = req.params
    const plan = await Plan.findById(planId).populate("currency").lean();
    return res.json({
      result:plan,
      message:'Plan retrieved successfully!'
    })
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      error: "Problem in Retrieving a plan",
    });   
  }
}

exports.updatePlan = async (req, res) => {
  try {
    const { planId } = req.params;
    if(req.body.isSubscription){
      const { name, description } = req.body;
      const updatedPlan = await Plan.findByIdAndUpdate(planId, req.body);
        await updateStripePlan(updatedPlan.stripe, { name, description });
      return res.json({
        result: updatedPlan,
        message: "Plan updated successfully!",
      });
    } else {
      const updatedPlan = await Plan.findByIdAndUpdate(planId, req.body);
      return res.json({
        result: updatedPlan,
        message: "Plan updated successfully!",
      })
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: "Problem in Updating plan!",
    });
  }
};

exports.deletePlan = async (req, res) => {
  try {
    const { planId } = req.params;
    const updatedPlan = await Plan.findByIdAndUpdate(planId, {
      isDeleted: true,
    });
    return res.json({
      message: "Plan deleted successfully",
      result: null,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: "Problem in Deleting plan!",
    });
  }
};
