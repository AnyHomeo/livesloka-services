const fetch = require("node-fetch");
const { asyncForEach } = require("../config/helper");
const CustomerModel = require("../models/Customer.model");
const SubjectModel = require("../models/Subject.model");
let accessToken = "";
let expiresAt = new Date().getTime();

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
    let json = await response.json();
    accessToken = json["access_token"];
    expiresAt = json["expires_in"] * 1000 + new Date().getTime();
    return accessToken;
  } else {
    return accessToken;
  }
};

exports.createProduct = async (req, res) => {
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
      return res.json({
        result: "Subject Created Successfully",
        result: response,
        accessToken,
      });
    } else {
      if (Array.isArray(response.details) && details.length) {
        return res
          .status(400)
          .json({ error: `"${details[0].value}" is Invalid` });
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
    let accessToken = await getAccessToken();
    let responses = [];
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
                value: price.toString(),
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
      responses.push(response);
    });
    return res.json({ message: "Plans Created Successfully!", responses });
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
    let response = await fetch(
      `${process.env.PAYPAL_API_KEY}/catalogs/products`,
      config
    );
    let result = await response.json() 
    if(response.statusText !== "OK"){
      return res.status(400).json({
        error: "Something went wrong in retrieving products from paypal!",
        result
      })
    }
    return res.json({
      result: result,
      message: "Products Retrieved successfully!",
      accessToken,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Something went wrong!!" });
  }
};

exports.getPlansByCustomerId = async (req,res) => {
  try {
    const { customerId } = req.params
    const customer = await CustomerModel.findById(customerId).populate("subject","productId").lean();
    console.log(customer)
    if(customer){ 
      const {productId} = customer.subject
      if(productId){
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
      if(response.statusText !== "OK"){
        return res.status(400).json({
          result,
          message: "Something went wrong in retrieving plans from paypal!",
        });
      }
      return res.json({
        result,
        message: "Plans Retrieved successfully!",
      });
      } else {
        return res.status(400).json({error:"No plans available for selected Subject"});
      }
    } else {
      return res.status(400).json({error:"Invalid customer Id"});
    }      
  } catch (error) {
    console.log(error)
    return res.status(500).json({ error: "Something went wrong!!" });
  }
}

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
    if(response.statusText !== "OK"){
      return res.status(400).json({
        result,
        message: "Something went wrong in retrieving plans from paypal!",
      });
    }
    return res.json({
      result,
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
