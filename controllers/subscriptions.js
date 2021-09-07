const fetch = require("node-fetch");
const { asyncForEach } = require("../config/helper");
const CustomerModel = require("../models/Customer.model");
const SubjectModel = require("../models/Subject.model");
const OptionModel = require("../models/SlotOptions");
const times = require("../models/times.json");
const moment = require("moment");
const ZoomAccountModel = require("../models/ZoomAccount.model");
const ClassHistoryModel = require("../models/ClassHistory.model");
const SchedulerModel = require("../models/Scheduler.model");
const TeacherModel = require("../models/Teacher.model");
let accessToken = "";
let expiresAt = new Date().getTime();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const isValidAccessToken = () => {
  return !!accessToken && expiresAt > new Date().getTime();
};

const getAccessToken = async () => {
  if (!isValidAccessToken()) {
    const paypalTokenParams = new URLSearchParams();
    paypalTokenParams.append("grant_type", "client_credentials");
    let response = await fetch(`${process.env.PAYPAL_API_KEY}/oauth2/token`, {
      method: "POST",
      body: paypalTokenParams,
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(
            `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`,
            "binary"
          ).toString("base64"),
      },
    });
    console.log(response);
    let json = await response.json();
    accessToken = json["access_token"];
    expiresAt = json["expires_in"] * 1000 + new Date().getTime();
    return accessToken;
  } else {
    return accessToken;
  }
};

exports.createProductValidations = async (req, res, next) => {
  try {
    const { name, description, subject, image } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Name is Required" });
    }
    if (!description) {
      return res.status(400).json({ error: "Description is Required" });
    }
    if (!image) {
      return res.status(400).json({ error: "Image Url is Required" });
    }
    if (!subject) {
      return res.status(400).json({ error: "Subject is Required" });
    }
    next();
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ error: "Something went wrong in validation!" });
  }
};

exports.createPlanValidations = async (req, res, next) => {
  try {
    const { productIds, name, description, months, price } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Name is Required" });
    }
    if (!description) {
      return res.status(400).json({ error: "Description is Required" });
    }
    if (Array.isArray(productIds) && !productIds.length) {
      return res.status(400).json({ error: "Minimum 1 subject required" });
    }
    if (!months) {
      return res.status(400).json({ error: "Months are Required" });
    }
    if (!price) {
      return res.status(400).json({ error: "Price is Required" });
    }
    next();
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ error: "Something went wrong in validation!" });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { name, description, subject, image } = req.body;
    let subjectData = await SubjectModel.findOne({ id: subject });
    if (!subjectData) {
      return res.status(400).json({ error: "Subject is Invalid" });
    }
    let accessToken = await getAccessToken();
    let body = JSON.stringify({
      name,
      description,
      type: "SERVICE",
      category: "EDUCATIONAL_AND_TEXTBOOKS",
      image_url: image,
      home_url: "https://mylivesloka.com",
    });
    let config = {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body,
    };
    let response = await fetch(
      `${process.env.PAYPAL_API_KEY}/catalogs/products`,
      config
    );
    response = await response.json();
    if (response.id) {
      subjectData.productId = response.id;
      await subjectData.save();
      const product = await stripe.products.create({
        name,
        description,
        images: [image],
        id: response.id,
      });
      return res.json({
        message: "Subject Created Successfully",
        result: { paypal: response, stripe: product },
      });
    } else {
      if (Array.isArray(response.details) && response.details.length) {
        return res
          .status(400)
          .json({ error: `${response.details[0].value} is Invalid` });
      }
      return res.status(400).json({ error: "Product not created" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Something went wrong!!" });
  }
};

exports.createPlan = async (req, res) => {
  try {
    const { productIds, name, description, months } = req.body;
    let accessToken = await getAccessToken();
    let responses = [];
    let stripeResponses = [];
    await asyncForEach(productIds, async (productId, i) => {
      let body = JSON.stringify({
        name,
        product_id: productId,
        description,
        status: "ACTIVE",
        billing_cycles: [
          {
            frequency: {
              interval_unit: "MONTH",
              interval_count: months,
            },
            tenure_type: "REGULAR",
            sequence: 1,
            total_cycles: 0,
            pricing_scheme: {
              fixed_price: {
                value: req.body.price.toString(),
                currency_code: "USD",
              },
            },
          },
        ],
        payment_preferences: {
          auto_bill_outstanding: true,
          setup_fee: {
            value: "0",
            currency_code: "USD",
          },
          setup_fee_failure_action: "CONTINUE",
          payment_failure_threshold: 3,
        },
        taxes: {
          percentage: "0",
          inclusive: false,
        },
      });
      let config = {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body,
      };

      let response = await fetch(
        `${process.env.PAYPAL_API_KEY}/billing/plans`,
        config
      );
      response = await response.json();
      const price = await stripe.prices.create({
        unit_amount: req.body.price,
        currency: "usd",
        recurring: { interval: "month", interval_count: months },
        product: productId,
      });
      console.log(response, price);
      responses.push({ paypal: response, stripe: price });
    });
    return res.json({
      message: "Plans Created Successfully!",
      result: { paypal: responses, stripe: stripeResponses },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Something went wrong!!" });
  }
};

exports.getProducts = async (req, res) => {
  try {
    let accessToken = await getAccessToken();
    let config = {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    };
    console.log("process.env.PAYPAL_API_KEY");
    let response = await fetch(
      `${process.env.PAYPAL_API_KEY}/catalogs/products`,
      config
    );
    let result = await response.json();
    if (response.statusText !== "OK") {
      return res.status(400).json({
        error: "Something went wrong in retrieving products from paypal!",
        result,
      });
    }
    const products = await stripe.products.list({});
    return res.json({
      result: result,
      stripe: products,
      message: "Products Retrieved successfully!",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Something went wrong!!" });
  }
};

exports.getPlansByCustomerId = async (req, res) => {
  try {
    const { customerId } = req.params;
    const customer = await CustomerModel.findById(customerId)
      .populate("subject", "productId")
      .lean();
    if (customer) {
      const { productId } = customer.subject;
      if (productId) {
        let accessToken = await getAccessToken();
        let config = {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        };
        let response = await fetch(
          `${process.env.PAYPAL_API_KEY}/billing/plans?product_id=${productId}`,
          config
        );
        let result = await response.json();
        if (response.statusText !== "OK") {
          return res.status(400).json({
            result,
            message: "Something went wrong in retrieving plans from paypal!",
          });
        }
        let plans = await Promise.all(
          result.plans.map(async (plan) => {
            let planId = plan.id;
            let response = await fetch(
              `${process.env.PAYPAL_API_KEY}/billing/plans/${planId}`,
              config
            );
            let result = await response.json();
            return result;
          })
        );
        let stripePlans;
        try {
          stripePlans = await stripe.prices.list({
            product: productId,
          });
        } catch (error) {
          console.log(error);
        }

        return res.json({
          result: plans,
          stripePlans,
          message: "Plans Retrieved successfully!",
        });
      } else {
        return res
          .status(400)
          .json({ error: "No plans available for selected Subject" });
      }
    } else {
      return res.status(400).json({ error: "Invalid customer Id" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Something went wrong!!" });
  }
};

exports.getPlans = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!productId)
      return res.status(400).json({ error: "Product Id is required" });
    let accessToken = await getAccessToken();
    let config = {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    };
    let response = await fetch(
      `${process.env.PAYPAL_API_KEY}/billing/plans?product_id=${productId}`,
      config
    );
    let result = await response.json();
    if (response.statusText !== "OK") {
      return res.status(400).json({
        result,
        message: "Something went wrong in retrieving plans from paypal!",
      });
    }
    let prices;
    try {
      prices = await stripe.prices.list({
        product: productId,
      });
    } catch (error) {
      console.log(error);
    }

    return res.json({
      result,
      stripe: prices,
      message: "Plans Retrieved successfully!",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Something went wrong!!" });
  }
};

exports.getPlanById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "Plan Id is Required." });
    }
    let accessToken = await getAccessToken();
    let config = {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    };
    let response = await fetch(
      `${process.env.PAYPAL_API_KEY}/billing/plans/${id}`,
      config
    );
    return res.json({
      result: response,
      message: "Plans Retrieved successfully!",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Something went wrong!!" });
  }
};

exports.updateProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const { description, image } = req.body;
    let body = [];
    if (description) {
      body.push({
        op: "replace",
        path: "/description",
        value: description,
      });
    }
    if (image) {
      body.push({
        op: "replace",
        path: "/image_url",
        value: image,
      });
    }
    let accessToken = await getAccessToken();
    let config = {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    };
    if (body.length) {
      let response = await fetch(
        `${process.env.PAYPAL_API_KEY}/catalogs/products/${id}`,
        config
      );
      console.log(response);
      return res.json({ message: "Updated product successfully!" });
    } else {
      return res.json({ message: "No updated Field!" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Something went wrong!!" });
  }
};

exports.updatePlanById = async (req, res) => {
  try {
    const { description, price } = req.body;
    const { id } = req.params;
    if (description) {
      let config = {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          {
            op: "replace",
            path: "/description",
            value: description,
          },
        ]),
      };
      let response = await fetch(
        `${process.env.PAYPAL_API_KEY}/catalogs/products/${id}`,
        config
      );
      console.log(response);
      return res.json({ message: "Updated product successfully!" });
    }
    if (price) {
      if (isNaN(price)) {
        return res.status(500).json({ message: "Price is numeric" });
      }
      let config = {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pricing_schemes: [
            {
              billing_cycle_sequence: 1,
              pricing_scheme: {
                fixed_price: {
                  value: price.toString(),
                  currency_code: "USD",
                },
                roll_out_strategy: {
                  effective_time: moment().format(),
                  process_change_from: "NEXT_PAYMENT",
                },
              },
            },
          ],
        }),
      };
      let response = await fetch(
        `${process.env.PAYPAL_API_KEY}/billing/plans/${id}/update-pricing-schemes`,
        config
      );
      console.log(response);
      return res.json({ message: "Updated product successfully!" });
    }
    return res.json({ message: "No field updated!" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Something went wrong!!" });
  }
};

exports.activatePlan = async (req, res) => {
  try {
    //422 if already activated
    const { planId } = req.params;
    let config = {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    };
    let response = await fetch(
      `${process.env.PAYPAL_API_KEY}/billing/plans/${planId}/activate`,
      config
    );

    return res.json({
      message: "Plan Activated successfully!",
      result: response,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Something went wrong!!" });
  }
};

exports.deactivatePlan = async (req, res) => {
  try {
    //422 if already deactivated
    const { planId } = req.params;
    let config = {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    };
    let response = await fetch(
      `${process.env.PAYPAL_API_KEY}/billing/plans/${planId}/deactivate`,
      config
    );

    return res.json({
      message: "Plan Activated successfully!",
      result: response,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Something went wrong!!" });
  }
};

exports.subscribeCustomerToAPlan = async (req, res) => {
  try {
    const { customerId, planId } = req.params;
    const customer = await CustomerModel.findOne({ _id: customerId }).lean();
    if (!customer) {
      return res.status(400).json({ error: "Invalid or Deleted customer Id" });
    }
    let accessToken = await getAccessToken();
    let subscriptionBody = {
      plan_id: planId,
      start_time: moment.utc().add(10, "seconds").format(),
      quantity: "1",
      subscriber: {
        name: {
          given_name: customer.firstName,
        },
        email_address: customer.email,
      },
      application_context: {
        brand_name: "Live Sloka",
        locale: "en-US",
        shipping_preference: "NO_SHIPPING",
        user_action: "SUBSCRIBE_NOW",
        payment_method: {
          payer_selected: "PAYPAL",
          payee_preferred: "IMMEDIATE_PAYMENT_REQUIRED",
        },
        return_url: `${process.env.SERVICES_URL}/subscriptions/subscription/success/${customerId}`,
        cancel_url: `${process.env.USER_CLIENT_URL}/subscriptions/failure`,
      },
    };
    let config = {
      body: JSON.stringify(subscriptionBody),
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    };

    let response = await fetch(
      `${process.env.PAYPAL_API_KEY}/billing/subscriptions`,
      config
    );
    let result = await response.json();
    console.log(JSON.stringify(result, null, 1));
    console.log(response);
    if (response.statusText !== "Created") {
      return res.redirect(
        `${process.env.USER_CLIENT_URL}/subscriptions/failure`
      );
    } else {
      let redirectLink = result.links.filter(
        (link) => link.rel === "approve"
      )[0];
      return res.redirect(redirectLink.href);
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Something went wrong!!" });
  }
};

exports.subscribeCustomerToAStripePlan = async (req, res) => {
  try {
    const { customerId, priceId } = req.params;
    const customer = await CustomerModel.findById(customerId);
    const stripeCustomer = await stripe.customers.create({
      metadata: { _id: customerId },
      email: customer.email,
      name: customer.firstName,
    });
    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomer.id,
      items: [
        {
          price: priceId,
        },
      ],
      payment_behavior: "default_incomplete",
      expand: ["latest_invoice.payment_intent"],
    });
    customer.stripeId = stripeCustomer.id;
    await customer.save();
    res.json({
      subscriptionId: subscription.id,
      clientSecret: subscription.latest_invoice.payment_intent.client_secret,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Something went wrong!!" });
  }
};

const getNextSlot = (slot) => {
  let day = slot.split("-")[0];
  let time = slot.split("-")[1] + "-" + slot.split("-")[2];
  let index = times.indexOf(time);
  let nextSlot = day + "-" + times[index + 1];
  return nextSlot;
};

const generateScheduleDescriptionAndSlots = (slots) => {
  let scheduleDescription = [];
  let slotsObject = Object.keys(slots).reduce((accumulator, key) => {
    if (key === "_id") {
      return accumulator;
    } else {
      let slot = slots[key];
      let splittedSlot = slot.split("-");
      scheduleDescription.push(
        `${splittedSlot[0].toLowerCase()}-${splittedSlot[1]}`
      );
      accumulator[key.toUpperCase()] = [slot, getNextSlot(slot)];
      return accumulator;
    }
  }, {});

  return {
    scheduleDescription: scheduleDescription.join(","),
    slots: slotsObject,
  };
};

exports.handleSuccessfulSubscription = async (req, res) => {
  try {
    const { customerId } = req.params;
    const option = await OptionModel.findOne({
      customer: customerId,
    }).lean();
    const customer = await CustomerModel.findById(customerId);
    const teacher = await TeacherModel.findOne({ id: option.teacher });
    const subject = await SubjectModel.findOne({ id: customer.subjectId });

    if (option.selectedSlotType === "NEW") {
      //* 1 generate class name
      let className = `${customer.firstName} ${
        customer.age ? `${customer.age}Y` : ""
      } ${subject.subjectName}- ${teacher.TeacherName}`;
      //*  generate indian schedule description
      let selectedOption = option.options.filter((option) =>
        option._id.equals(option.selectedSlotId)
      );
      let { scheduleDescription, slots } =
        generateScheduleDescriptionAndSlots(selectedOption);
      let allSlots = [];
      Object.keys(slots).forEach((day) => {
        allSlots = [...allSlots, ...slots[day]];
      });
      let meetingLinkResponse = {};
      //* 3 generate a meeting link through zoom by selecting an account incase if not able to generate link send message in chatbot
      let availableZoomAccount = await ZoomAccountModel.findOne({
        timeSlots: {
          $nin: allSlots,
        },
      });
      const {
        _id: zoomAccountId,
        zoomEmail,
        zoomJwt,
        zoomPassword,
      } = availableZoomAccount;
      const formData = {
        topic: "Livesloka Online Class",
        type: 3,
        password: zoomPassword,
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: true,
          jbh_time: 0,
          mute_upon_entry: true,
          watermark: false,
          use_pmi: false,
          approval_type: 2,
          audio: "both",
          auto_recording: "none",
          waiting_room: false,
          meeting_authentication: false,
        },
      };
      meetingLinkResponse = await fetch(
        `https://api.zoom.us/v2/users/${zoomEmail}/meetings`,
        {
          method: "post",
          body: JSON.stringify(formData),
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${zoomJwt}`,
          },
        }
      );
      //* 5 get the selected zoom account and update timeslots
      allSlots.forEach((slot) => {
        availableZoomAccount.timeSlots.push(slot);
      });
      await availableZoomAccount.save();
      meetingLinkResponse = await meetingLinkResponse.json();
      let otherSchedulesOfCustomer = await SchedulerModel.find({
        students: {
          $in: [customer._id],
          isDeleted: {
            $ne: true,
          },
        },
      });
      await asyncForEach(otherSchedulesOfCustomer, async (schedule) => {
        let index = schedule.students.indexOf(customer._id);
        if (index !== -1) {
          schedule.students.splice(index, 1);
          if (!schedule.students.length) {
            schedule.isDeleted = true;
          }
          await schedule.save();
        }
      });

      //* 4 create a schedule
      const schedule = new SchedulerModel({
        meetingAccount: zoomAccountId,
        meetingLink: meetingLinkResponse.join_url || "",
        teacher: teacher.id,
        students: [customer._id],
        startDate: new Date(),
        slots,
        demo: true,
        OneToOne: true,
        className,
        subject: subject._id,
        scheduleDescription,
      });

      await schedule.save();

      //* 7 add schedule desc,meetinglink,teacherId,classStatusId as 121975682530440
      await CustomerModel.updateOne(
        { _id: customer._id },
        {
          $set: {
            scheduleDescription,
            meetingLink: meetingLinkResponse.join_url,
            teacherId: teacher.id,
            classStatusId: "121975682530440",
            paidTill: moment().add(1, "month").format(),
          },
        }
      );

      //* 8 update teacher avaialable and scheduled slots
      allSlots.forEach((slot) => {
        let index = teacher.availableSlots.indexOf(slot);
        if (index != -1) {
          teacher.availableSlots.splice(index, 1);
        }
        teacher.scheduledSlots.push(slot);
      });
      teacher.availableSlots = [...new Set(teacher.availableSlots)];
      teacher.scheduledSlots = [...new Set(teacher.scheduledSlots)];
      await teacher.save();
      return res.json({
        message: "Scheduled Meeting Successfully!",
      });
    } else if (option.selectedSlotType === "EXISTING") {
      //* 1 update class Name
      let otherSchedulesOfCustomer = await SchedulerModel.find({
        students: {
          $in: [customer._id],
          isDeleted: {
            $ne: true,
          },
        },
      });
      await asyncForEach(otherSchedulesOfCustomer, async (schedule) => {
        let index = schedule.students.indexOf(customer._id);
        if (index !== -1) {
          schedule.students.splice(index, 1);
          if (!schedule.students.length) {
            schedule.isDeleted = true;
          }
          await schedule.save();
        }
      });

      let schedule = await SchedulerModel.findById(option.selectedSlotId);
      schedule.students.push(customer._id);
      //* 2 update schedule with new customer
      customer.scheduleDescription = schedule.scheduleDescription;
      customer.meetingLink = schedule.meetingLink;
      customer.teacherId = schedule.teacher;
      customer.classStatusId = "121975682530440";
      await customer.save();

      return res.json({
        message: "Scheduled class Successfully!",
      });
    } else {
      return res
        .status(500)
        .json({ error: "Please select the options initially!" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Something went wrong!!" });
  }
};
