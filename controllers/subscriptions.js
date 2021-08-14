const fetch = require("node-fetch");
const { asyncForEach } = require("../config/helper");
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
    if(!image){
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
    if(response.id){
      subjectData.productId = response.id;
      await subjectData.save();
      return res.json({ result: "Subject Created Successfully",result:response });
    } else {
      if(Array.isArray(response.details) && details.length){
        return res.status(400).json({ error:`"${details[0].value}" is Invalid`})
      }
      return res.status(400).json({ error: "Product not created"})
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Something went wrong!!" });
  }
};

exports.createPlan = async (req, res) => {
  try {
    const { productIds,name,description,months,price } = req.body
    if (!name) {
      return res.status(400).json({ error: "Name is Required" });
    }
    if (!description) {
      return res.status(400).json({ error: "Description is Required" });
    }
    if(Array.isArray(productIds) && !productIds.length){
      return res.status(400).json({ error: "Minimum 1 subject required" });
    }
    if (!months) {
      return res.status(400).json({ error: "Months are Required" });
    }
    if (!price) {
      return res.status(400).json({ error: "Price is Required" });
    }
    let accessToken = await getAccessToken();
    let responses = []
    await asyncForEach(productIds,async (productId,i) => {
      let body = JSON.stringify({
        name,
        product_id:productId,
        description,
        status: "ACTIVE",
        billing_cycles: [
          {
            "frequency": {
              "interval_unit": "MONTH",
              "interval_count": months
            },
            "tenure_type": "REGULAR",
            "sequence": 1,
            "total_cycles": 0,
            "pricing_scheme": {
              "fixed_price": {
                "value": price.toString(),
                "currency_code": "USD"
              }
            }
          }
        ],
        "payment_preferences": {
          "auto_bill_outstanding": true,
          "setup_fee": {
            "value": "0",
            "currency_code": "USD"
          },
          "setup_fee_failure_action": "CONTINUE",
          "payment_failure_threshold": 3
        },
        "taxes": {
          "percentage": "0",
          "inclusive": false
        }
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
      responses.push(response)
    })
    return res.json({ message: "Plans Created Successfully!",responses });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Something went wrong!!" });
  }
};

exports.getProducts = async (req,res) => {
  try {
    
  } catch (error) {
    console.log(error)
    return res.status(500).json({ error: "Something went wrong!!" });
  }
}

exports.getPlans = async (req,res) => {
  try {
    
  } catch (error) {
    console.log(error)
    return res.status(500).json({ error: "Something went wrong!!" });
  }
}

exports.getPlanById = async (req,res) => {
  try {
    
  } catch (error) {
    console.log(error)
    return res.status(500).json({ error: "Something went wrong!!" });
  }
}

exports.updateProductById = async (req,res) => {
  try {
    
  } catch (error) {
    console.log(error)
    return res.status(500).json({ error: "Something went wrong!!" });
  }
}
exports.updatePlanById = async (req,res) => {
  try {
    
  } catch (error) {
    console.log(error)
    return res.status(500).json({ error: "Something went wrong!!" });
  }
}

exports.activatePlan = async (req,res) => {
  try {
    //422 if already activated

  } catch (error) {
    console.log(error)
    return res.status(500).json({ error: "Something went wrong!!" });
  }
}

exports.deactivatePlan = async (req,res) => {
  try {
    //422 if already deactivated
    
  } catch (error) {
    console.log(error)
    return res.status(500).json({ error: "Something went wrong!!" });
  }
}