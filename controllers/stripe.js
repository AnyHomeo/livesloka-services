const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
exports.createStripeProduct = async (data) => {
  try {
    const product = await stripe.products.create(data);
    return { type: "success", result: product };
  } catch (error) {
    return { type: "error", result: error };
  }
};

exports.updateStripeProduct = async (id, updatedFields) => {
  try {
    const product = await stripe.products.update(id, updatedFields);
    return { type: "success", result: product };
  } catch (error) {
    return { type: "error", result: error };
  }
};

exports.deleteStripeProduct = async (id) => {
  try {
    const deleted = await stripe.products.del(id);
    return { type: "success", result: deleted };
  } catch (error) {
    return { type: "error", result: error };
  }
};

exports.createStripePlan = async (data) => {
  try {
    const price = await stripe.prices.create(data);
    return { type: "success", result: price };
  } catch (error) {
    return { type: "error", result: error };
  }
};

exports.updateStripePlan = async (id,data) => {
  try {
    const price = await stripe.prices.update(
      id,
      data
    );
    return { type: "success", result: price };
  } catch (error) {
    return { type: "error", result: error };
  }
};