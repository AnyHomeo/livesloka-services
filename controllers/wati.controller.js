require("dotenv").config()
const CustomerModel = require("./models/Customer.model");
const fetch = require("node-fetch");

const watiApiKey = process.env.WATI_API_KEY
const watiApiHost = process.env.WATI_API_HOST

export const watiWebhookController = (req, res) => {
  try {
    console.log(JSON.stringify(req.body, null, 2), req.query);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: error.message,
      result: error,
    });
  }
};

export const addWatiContacts = (req, res) => {
  try {
    const customersWithoutWatiContactId = await CustomerModel.find({
        watiContactId: { $exists: false },
      })
        .limit(1)
        .populate("timeZone")
        .lean();
    
        let addedMobileNumbers = [];
        for (let i = 0; i < customersWithoutWatiContactId.length; i++) {
          const customer = customersWithoutWatiContactId[i];
          console.log(JSON.stringify(customer, null, 2));
  
          if (!addedMobileNumbers.includes(customer.whatsAppnumber)) {
            let data = {
              name: `${customer.firstName ?? ""} (${customer.lastName ?? ""})`,
              customParams: [],
            };

            if(customer?.timeZone?.timeZoneName){
                data.customParams.push({
                    name: "Timezone",
                    value: customer.timezone.timeZoneName
                })
            }
            const formattedPhoneNumber = customer.whatsAppnumber.replace(" ", "").replace("+", "")
            let response = await fetch(
              `${watiApiHost}/api/v1/addContact/${formattedPhoneNumber}`,
              {
                method: "POST",
                body: JSON.stringify(data),
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${watiApiKey}`,
                },
              }
            );
            response = await response.json();
            console.log(response);
          }
        }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: error.message,
      result: error,
    });
  }
};