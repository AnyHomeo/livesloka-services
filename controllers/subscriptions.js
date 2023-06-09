const fetch = require('node-fetch');
const momentTZ = require('moment-timezone');
const {
  asyncForEach,
  getNameFromTimezone,
  sendSMS,
  sendAdminsMessage,
} = require('../config/helper');
const CustomerModel = require('../models/Customer.model');
const SubjectModel = require('../models/Subject.model');
const OptionModel = require('../models/SlotOptions');
const times = require('../models/times.json');
const moment = require('moment');
const ZoomAccountModel = require('../models/ZoomAccount.model');
const SchedulerModel = require('../models/Scheduler.model');
const TeacherModel = require('../models/Teacher.model');
const { capitalize } = require('../scripts');
const SubscriptionModel = require('../models/Subscription');
const StripeTransaction = require('../models/StripeTransactions');
const PaypalTransaction = require('../models/PaypalTransactions');
const Plan = require('../models/Plan.model');
const TimeZoneModel = require('../models/timeZone.model');
const CurrencyModel = require('../models/Currency.model');
const {
  SUCCESSFUL_SUBSCRIPTION,
  ADMIN_PAYMENT_SUCCESSFUL,
  ADMIN_UNSUBSCRIBE,
} = require('../config/messages');
const { createSlotsZoomLink, generateSlots } = require('../config/util');

let accessToken = '';
let expiresAt = new Date().getTime();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const isValidAccessToken = () => {
  return !!accessToken && expiresAt > new Date().getTime();
};

const getAccessToken = async () => {
  if (!isValidAccessToken()) {
    const paypalTokenParams = new URLSearchParams();
    paypalTokenParams.append('grant_type', 'client_credentials');
    let response = await fetch(`${process.env.PAYPAL_API_KEY}/oauth2/token`, {
      method: 'POST',
      body: paypalTokenParams,
      headers: {
        Authorization:
          'Basic ' +
          Buffer.from(
            `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`,
            'binary'
          ).toString('base64'),
      },
    });
    let json = await response.json();
    accessToken = json['access_token'];
    expiresAt = json['expires_in'] * 1000 + new Date().getTime();
    return accessToken;
  } else {
    return accessToken;
  }
};

exports.getAccessToken = getAccessToken;
exports.isValidAccessToken = isValidAccessToken;
exports.createProductValidations = async (req, res, next) => {
  try {
    const { name, description, subject, image } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name is Required' });
    }
    if (!description) {
      return res.status(400).json({ error: 'Description is Required' });
    }
    if (!subject) {
      return res.status(400).json({ error: 'Subject is Required' });
    }
    next();
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ error: 'Something went wrong in validation!' });
  }
};

exports.createPlanValidations = async (req, res, next) => {
  try {
    const { productIds, name, description, months, price } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name is Required' });
    }
    if (!description) {
      return res.status(400).json({ error: 'Description is Required' });
    }
    if (Array.isArray(productIds) && !productIds.length) {
      return res.status(400).json({ error: 'Minimum 1 subject required' });
    }
    if (!months) {
      return res.status(400).json({ error: 'Months are Required' });
    }
    if (!price) {
      return res.status(400).json({ error: 'Price is Required' });
    }
    next();
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ error: 'Something went wrong in validation!' });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { name, description, subject } = req.body;
    let subjectData = await SubjectModel.findOne({ id: subject });
    if (!subjectData) {
      return res.status(400).json({ error: 'Subject is Invalid' });
    }
    let accessToken = await getAccessToken();
    let body = JSON.stringify({
      name,
      description,
      type: 'SERVICE',
      category: 'EDUCATIONAL_AND_TEXTBOOKS',
      home_url: 'https://mylivesloka.com',
    });
    let config = {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
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
        id: response.id,
      });
      return res.json({
        message: 'Subject Created Successfully',
        result: { paypal: response, stripe: product },
      });
    } else {
      if (Array.isArray(response.details) && response.details.length) {
        return res
          .status(400)
          .json({ error: `${response.details[0].value} is Invalid` });
      }
      return res.status(400).json({ error: 'Product not created' });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Something went wrong!!' });
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
        status: 'ACTIVE',
        billing_cycles: [
          {
            frequency: {
              interval_unit: 'MONTH',
              interval_count: months,
            },
            tenure_type: 'REGULAR',
            sequence: 1,
            total_cycles: 0,
            pricing_scheme: {
              fixed_price: {
                value: req.body.price.toString(),
                currency_code: 'USD',
              },
            },
          },
        ],
        payment_preferences: {
          auto_bill_outstanding: true,
          setup_fee: {
            value: '0',
            currency_code: 'USD',
          },
          setup_fee_failure_action: 'CONTINUE',
          payment_failure_threshold: 3,
        },
        taxes: {
          percentage: '0',
          inclusive: false,
        },
      });
      let config = {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body,
      };

      let response = await fetch(
        `${process.env.PAYPAL_API_KEY}/billing/plans`,
        config
      );
      response = await response.json();
      const price = await stripe.prices.create({
        unit_amount: parseFloat(req.body.price) * 100,
        currency: 'usd',
        recurring: { interval: 'month', interval_count: months },
        product: productId,
      });
      responses.push({ paypal: response, stripe: price });
    });
    return res.json({
      message: 'Plans Created Successfully!',
      result: { paypal: responses, stripe: stripeResponses },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Something went wrong!!' });
  }
};

exports.getProducts = async (req, res) => {
  try {
    let accessToken = await getAccessToken();
    let config = {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    };
    let response = await fetch(
      `${process.env.PAYPAL_API_KEY}/catalogs/products?page_size=100`,
      config
    );
    let result = await response.json();
    result.products = result.products.sort((a, b) => {
      return new Date(b.create_time) - new Date(a.create_time);
    });
    if (response.statusText !== 'OK') {
      return res.status(400).json({
        error: 'Something went wrong in retrieving products from paypal!',
        result,
      });
    }
    const products = await stripe.products.list({});
    return res.json({
      result: result,
      stripe: products,
      accessToken,
      message: 'Products Retrieved successfully!',
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Something went wrong!!' });
  }
};

exports.getPlansByCustomerId = async (req, res) => {
  try {
    const { customerId } = req.params;
    const customer = await CustomerModel.findById(customerId)
      .populate('subject', 'productId')
      .lean();
    if (customer) {
      const { productId } = customer.subject;
      if (productId) {
        let accessToken = await getAccessToken();
        let config = {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        };
        let response = await fetch(
          `${process.env.PAYPAL_API_KEY}/billing/plans?product_id=${productId}`,
          config
        );
        let result = await response.json();
        if (response.statusText !== 'OK') {
          return res.status(400).json({
            result,
            message: 'Something went wrong in retrieving plans from paypal!',
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
          message: 'Plans Retrieved successfully!',
        });
      } else {
        return res
          .status(400)
          .json({ error: 'No plans available for selected Subject' });
      }
    } else {
      return res.status(400).json({ error: 'Invalid customer Id' });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Something went wrong!!' });
  }
};

exports.getPlans = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!productId)
      return res.status(400).json({ error: 'Product Id is required' });
    let accessToken = await getAccessToken();
    let config = {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    };
    let response = await fetch(
      `${process.env.PAYPAL_API_KEY}/billing/plans?product_id=${productId}`,
      config
    );
    let result = await response.json();
    if (response.statusText !== 'OK') {
      return res.status(400).json({
        result,
        message: 'Something went wrong in retrieving plans from paypal!',
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
      message: 'Plans Retrieved successfully!',
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Something went wrong!!' });
  }
};

exports.getPlanById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Plan Id is Required.' });
    }
    let accessToken = await getAccessToken();
    let config = {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    };
    let response = await fetch(
      `${process.env.PAYPAL_API_KEY}/billing/plans/${id}`,
      config
    );
    return res.json({
      result: response,
      message: 'Plans Retrieved successfully!',
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Something went wrong!!' });
  }
};

exports.updateProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const { description, image } = req.body;
    let body = [];
    if (description) {
      body.push({
        op: 'replace',
        path: '/description',
        value: description,
      });
    }
    if (image) {
      body.push({
        op: 'replace',
        path: '/image_url',
        value: image,
      });
    }
    let accessToken = await getAccessToken();
    let config = {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    };
    if (body.length) {
      let response = await fetch(
        `${process.env.PAYPAL_API_KEY}/catalogs/products/${id}`,
        config
      );
      return res.json({ message: 'Updated product successfully!' });
    } else {
      return res.json({ message: 'No updated Field!' });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Something went wrong!!' });
  }
};

exports.updatePlanById = async (req, res) => {
  try {
    const { description, price } = req.body;
    const { id } = req.params;
    if (description) {
      let config = {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          {
            op: 'replace',
            path: '/description',
            value: description,
          },
        ]),
      };
      let response = await fetch(
        `${process.env.PAYPAL_API_KEY}/catalogs/products/${id}`,
        config
      );
      return res.json({ message: 'Updated product successfully!' });
    }
    if (price) {
      if (isNaN(price)) {
        return res.status(500).json({ message: 'Price is numeric' });
      }
      let config = {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pricing_schemes: [
            {
              billing_cycle_sequence: 1,
              pricing_scheme: {
                fixed_price: {
                  value: price.toString(),
                  currency_code: 'USD',
                },
                roll_out_strategy: {
                  effective_time: moment().format(),
                  process_change_from: 'NEXT_PAYMENT',
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
      return res.json({ message: 'Updated product successfully!' });
    }
    return res.json({ message: 'No field updated!' });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Something went wrong!!' });
  }
};

exports.activatePlan = async (req, res) => {
  try {
    //422 if already activated
    const { planId } = req.params;
    let config = {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    };
    let response = await fetch(
      `${process.env.PAYPAL_API_KEY}/billing/plans/${planId}/activate`,
      config
    );

    return res.json({
      message: 'Plan Activated successfully!',
      result: response,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Something went wrong!!' });
  }
};

exports.deactivatePlan = async (req, res) => {
  try {
    //422 if already deactivated
    const { planId } = req.params;
    let config = {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    };
    let response = await fetch(
      `${process.env.PAYPAL_API_KEY}/billing/plans/${planId}/deactivate`,
      config
    );

    return res.json({
      message: 'Plan Activated successfully!',
      result: response,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Something went wrong!!' });
  }
};

const isFuture = (date) => {
  return moment().unix() - moment(date).unix() < 0;
};

exports.subscribeCustomerToAPlan = async (req, res) => {
  try {
    const { customerId, planId } = req.params;
    const { noSchedule } = req.query;
    const customer = await CustomerModel.findOne({ _id: customerId }).lean();
    if (!customer) {
      return res.status(400).json({ error: 'Invalid or Deleted customer Id' });
    }
    let accessToken = await getAccessToken();
    let subscriptionBody = {
      plan_id: planId,
      start_time: moment.utc().add(10, 'seconds').format(),
      quantity: '1',
      subscriber: {
        name: {
          given_name: customer.firstName,
        },
        email_address: customer.email,
      },
      application_context: {
        brand_name: 'Live Sloka',
        locale: 'en-US',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'SUBSCRIBE_NOW',
        payment_method: {
          payer_selected: 'PAYPAL',
          payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED',
        },
        return_url: `${process.env.SERVICES_URL}/subscriptions/subscription/success/${noSchedule}/${customerId}`,
        cancel_url: `${process.env.USER_CLIENT_URL}/subscriptions/failure`,
      },
    };
    let config = {
      body: JSON.stringify(subscriptionBody),
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    };

    let response = await fetch(
      `${process.env.PAYPAL_API_KEY}/billing/subscriptions`,
      config
    );
    let result = await response.json();
    if (response.statusText !== 'Created') {
      return res.redirect(
        `${process.env.USER_CLIENT_URL}/subscriptions/failure`
      );
    } else {
      let redirectLink = result.links.filter(
        (link) => link.rel === 'approve'
      )[0];
      return res.redirect(redirectLink.href);
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Something went wrong!!' });
  }
};

exports.subscribeCustomerToAStripePlan = async (req, res) => {
  try {
    const { customerId, priceId } = req.params;
    const { address, paymentMethod } = req.body;
    const customer = await CustomerModel.findById(customerId);
    const stripeCustomer = await stripe.customers.create({
      metadata: { _id: customerId },
      email: address.email,
      name: customer.firstName,
      address,
    });
    await stripe.paymentMethods.attach(paymentMethod, {
      customer: stripeCustomer.id,
    });
    const plan = await Plan.findById(priceId).lean();

    await stripe.customers.update(stripeCustomer.id, {
      invoice_settings: {
        default_payment_method: req.body.paymentMethod,
      },
    });

    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomer.id,
      items: [{ price: plan.stripe }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    });
    customer.stripeId = stripeCustomer.id;
    await customer.save();
    res.json({
      subscriptionId: subscription.id,
      clientSecret: subscription.latest_invoice.payment_intent.client_secret,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Something went wrong!!' });
  }
};

const getNextSlot = (slot) => {
  let day = slot.split('-')[0];
  let time = slot.split('-')[1] + '-' + slot.split('-')[2];
  let index = times.indexOf(time);
  let nextSlot = day + '-' + times[index + 1];
  return nextSlot;
};

const generateScheduleDescriptionAndSlots = (slots) => {
  let scheduleDescription = [];
  let slotsObject = Object.keys(slots).reduce((accumulator, key) => {
    if (key === '_id') {
      return accumulator;
    } else {
      let slot = slots[key];
      let splittedSlot = slot.split('-');
      scheduleDescription.push(
        `${capitalize(splittedSlot[0].toLowerCase())}-${splittedSlot[1]}`
      );
      accumulator[key] = [slot, getNextSlot(slot)];
      return accumulator;
    }
  }, {});

  return {
    scheduleDescription:
      'Attend class Every - ' + scheduleDescription.join(','),
    slots: slotsObject,
  };
};

const scheduleAndupdateCustomer = async (
  periodEndDate,
  customer,
  teacher,
  subject,
  option,
  res,
  needToSendToSuccessPage
) => {
  if (option) {
    if (option.isScheduled) {
      customer.paidTill = periodEndDate;
      await customer.save();
      if (needToSendToSuccessPage) {
        return res.redirect(`${process.env.USER_CLIENT_URL}/payment-success`);
      } else {
        return res.json({
          message: 'Scheduled Meeting Successfully!',
        });
      }
    }
    if (option.selectedSlotType === 'NEW') {
      //* 1 generate class name
      let className = `${customer.firstName} ${
        customer.age ? `${customer.age}Y` : ''
      } ${subject.subjectName}- ${teacher.TeacherName}`;
      //*  generate indian schedule description
      let selectedOption = option.options.filter((singleOption) =>
        singleOption._id.equals(option.selectedSlotId)
      )[0];
      let { scheduleDescription, slots } =
        generateScheduleDescriptionAndSlots(selectedOption);

      let meetingLinks = await createSlotsZoomLink(slots);
      if (typeof meetingLinks.message === 'string') {
        meetingLinks = {};
      }

      let otherSchedulesOfCustomer = await SchedulerModel.find({
        students: {
          $in: [customer._id],
        },
        isDeleted: {
          $ne: true,
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
        meetingLinks,
        teacher: teacher.id,
        students: [customer._id],
        startDate: moment().format(),
        slots,
        demo: false,
        OneToOne: false,
        oneToMany: true,
        className,
        subject: subject._id,
        scheduleDescription,
      });

      await schedule.save();

      //* 7 add schedule desc,meetinglink,teacherId,classStatusId as 113975223750050
      await CustomerModel.updateOne(
        { _id: customer._id },
        {
          $set: {
            scheduleDescription,
            teacherId: teacher.id,
            classStatusId: '113975223750050',
            paidTill: periodEndDate,
          },
        }
      );

      //* 8 update teacher avaialable and scheduled slots
      let [, allSlots] = generateSlots(slots);
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
      await OptionModel.updateOne({ _id: option._id }, { isScheduled: true });
      if (needToSendToSuccessPage) {
        return res.redirect(`${process.env.USER_CLIENT_URL}/payment-success`);
      } else {
        return res.json({
          message: 'Scheduled Meeting Successfully!',
        });
      }
    } else if (option.selectedSlotType === 'EXISTING') {
      //* 1 update class Name
      let otherSchedulesOfCustomer = await SchedulerModel.find({
        students: {
          $in: [customer._id],
        },
        isDeleted: {
          $ne: true,
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
      customer.classStatusId = '113975223750050';
      customer.paidTill = periodEndDate;
      await customer.save();
      await schedule.save();
      await OptionModel.updateOne({ _id: option._id }, { isScheduled: true });
      if (needToSendToSuccessPage) {
        return res.redirect(`${process.env.USER_CLIENT_URL}/payment-success`);
      } else {
        return res.json({
          message: 'Scheduled Meeting Successfully!',
        });
      }
    } else {
      return res
        .status(500)
        .json({ error: 'Please select the options initially!' });
    }
  } else {
    return res.json({ message: 'No Options available' });
  }
};

exports.scheduleAndupdateCustomer = scheduleAndupdateCustomer;

const deleteExistingSubscription = async (customer, reason) => {
  const latestSubscription = await SubscriptionModel.findOne({
    customerId: customer._id,
    isActive: true,
  });
  if (latestSubscription) {
    let { id, type } = latestSubscription;
    if (type === 'STRIPE') {
      await stripe.subscriptions.del(id);
      latestSubscription.isActive = false;
      latestSubscription.cancelledDate = new Date();
      latestSubscription.reason = reason;
      await latestSubscription.save();
    }
  }
};

exports.handleSuccessfulSubscription = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { sub_id, resubscribe } = req.query;
    const option = await OptionModel.findOne({
      customer: customerId,
    }).lean();
    const customer = await CustomerModel.findById(customerId);
    const subject = await SubjectModel.findOne({ id: customer.subjectId });
    let periodEndDate = moment().add(1, 'month').format();
    let timeZone = await TimeZoneModel.findOne({
      id: customer.timeZoneId || '141139634553016',
    });
    await deleteExistingSubscription(customer, 'Remove old subscriptions');
    const subscription = await stripe.subscriptions.retrieve(sub_id);
    periodEndDate = moment(subscription.current_period_end * 1000).format();
    const planId = await Plan.findOne({
      stripe: subscription.items.data[0].plan.id,
    });
    const newSubscription = new SubscriptionModel({
      customerId,
      stripeCustomer: customer.stripeId,
      type: 'STRIPE',
      planId: planId ? planId._id : '',
      isActive: true,
      id: sub_id,
    });
    await newSubscription.save();

    //message to admin and customer
    const zone = getNameFromTimezone(timeZone.timeZoneName) || 'Asia/Kolkata';
    let customerMessage = SUCCESSFUL_SUBSCRIPTION(
      parseFloat(subscription.items.data[0].plan.amount) / 100,
      subscription.items.data[0].plan.currency,
      subject.subjectName,
      momentTZ(periodEndDate).tz(zone).format('MMM Do YYYY')
    );
    sendSMS(
      customerMessage,
      `${customer.countryCode}${customer.whatsAppnumber}`.trim()
    );
    let adminMessage = ADMIN_PAYMENT_SUCCESSFUL(
      parseFloat(subscription.items.data[0].plan.amount) / 100,
      subscription.items.data[0].plan.currency,
      subject.subjectName,
      customer.firstName,
      momentTZ(periodEndDate).tz('Asia/Kolkata').format('MMM Do YYYY')
    );
    sendAdminsMessage(adminMessage);

    if (!resubscribe) {
      if (option) {
        const teacher = await TeacherModel.findOne({ id: option.teacher });
        await scheduleAndupdateCustomer(
          periodEndDate,
          customer,
          teacher,
          subject,
          option,
          res,
          false
        );
      } else {
        return res.json({ message: 'No Options available' });
      }
    } else {
      await CustomerModel.updateOne(
        { _id: customer._id },
        {
          $set: {
            paidTill: periodEndDate,
          },
        }
      );

      return res.json({
        message: 'Scheduled Meeting Successfully!',
      });
    }
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ error: 'Something went wrong!!', result: error });
  }
};

exports.cancelSubscription = async (req, res) => {
  try {
    const { customerId, reason } = req.body;
    const latestSubscription = await SubscriptionModel.findOne({
      customerId,
      isActive: true,
    })
      .populate('planId')
      .populate('customerId');
    const currency = await CurrencyModel.findById(
      latestSubscription.planId
        ? latestSubscription.planId.currency
        : '5f98fabdd5e2630017ec9ac1'
    );
    if (latestSubscription) {
      let { id } = latestSubscription;
      await stripe.subscriptions.del(id);
      latestSubscription.isActive = false;
      latestSubscription.cancelledDate = new Date();
      latestSubscription.reason = reason;
      await latestSubscription.save();
      if (typeof latestSubscription.customerId === 'object') {
        const { firstName, paidTill, countryCode, whatsAppnumber } =
          latestSubscription.customerId;
        let adminMessage = ADMIN_UNSUBSCRIBE(
          firstName,
          momentTZ().tz('Asia/Kolkata').format('MMM Do YY, hh:mm:ss a z'),
          latestSubscription.planId.amount,
          currency ? currency.currencyName : 'USD',
          paidTill,
          `${countryCode}${whatsAppnumber}`.trim()
        );
        sendAdminsMessage(adminMessage);
      }
      return res.json({
        message: 'Cancelled plan successfully!',
      });
    } else {
      return res.status(500).json({ error: 'No Active subscriptions' });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Something went wrong!!' });
  }
};

exports.getAllSubscriptions = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.query;
    let customer = await CustomerModel.findById(id).lean();
    if (!customer) {
      return res.status(400).json({ error: 'Invalid user id' });
    }
    let allCustomers = await CustomerModel.find({
      email: customer.email,
    });
    allCustomers = allCustomers.map((customer) => customer._id);
    const allSubscriptions = await SubscriptionModel.find({
      customerId: {
        $in: allCustomers,
      },
      isActive: isActive === '1',
    })
      .populate('customerId', 'firstName lastName paidTill')
      .lean();
    return res.json({
      result: allSubscriptions,
      message: 'All Subscriptions Retrieved Successfully!',
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Something went wrong!' });
  }
};

exports.listenToStripe = async (req, res) => {
  const event = req.body;
  switch (event.type) {
    case 'invoice.payment_succeeded':
      const customer = await CustomerModel.findOne({
        stripeId: event.data.object.customer,
      });
      if (customer) {
        customer.paidTill = moment(
          event.data.object.period_end * 1000
        ).format();
        await customer.save();
      }
      const newStripeTransaction = new StripeTransaction({
        customerId: customer ? customer._id : undefined,
        stripeCustomer: event.data.object.customer,
        paymentData: event,
      });
      await newStripeTransaction.save();
      break;
    case 'invoice.payment_failed':
      const failedCustomer = await CustomerModel.findOne({
        stripeId: event.data.object.customer,
      });
      const newFailedStripeTransaction = new StripeTransaction({
        customerId: failedCustomer ? failedCustomer._id : undefined,
        stripeCustomer: event.data.object.customer,
        paymentData: event,
        status: 'FAIL',
      });
      await newFailedStripeTransaction.save();
      break;
    default:
      // Unexpected event type
      console.log(`Unhandled event type ${event.type}.`);
  }
  // Return a 200 response to acknowledge receipt of the event
  res.send();
};

exports.listenToPaypal = async (req, res) => {
  const newPaypalTransaction = new PaypalTransaction({
    paymentData: req.body,
  });
  const response = await newPaypalTransaction.save();
  console.log(response);
  res.send();
};

exports.getAllTransactionsOfStripeCustomer = async (req, res) => {
  try {
    const { stripeCustomer } = req.params;
    const stripeResponse = await StripeTransaction.find({
      stripeCustomer,
    }).lean();
    return res.json({
      message: 'Transactions Retrieved successfully!',
      result: stripeResponse,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Something went wrong!' });
  }
};
