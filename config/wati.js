require("dotenv").config();
const fetch = require("node-fetch");

const watiApiKey = process.env.WATI_API_KEY;
const watiApiHost = process.env.WATI_API_HOST;

exports.sendWatiMessages = async (messages) => {
  let response = await fetch(`${watiApiHost}/api/v1/sendTemplateMessages`, {
    method: "POST",
    body: JSON.stringify(messages),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${watiApiKey}`,
    },
  });

  response = await response.json();
  return response;
};
