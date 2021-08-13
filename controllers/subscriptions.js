const fetch = require("node-fetch");

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

exports.createProduct = async (req,res) => {
  try {
      // const { name,description, }
      let accessToken = await getAccessToken();
    return res.json({ accessToken });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Something went wrong!!" });
  }
};

exports.createPlan = async (req,res) => {
  try {
    return res.json({ success: true });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Something went wrong!!" });
  }
};
