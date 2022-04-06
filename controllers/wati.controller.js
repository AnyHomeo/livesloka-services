require("dotenv").config();
const CustomerModel = require("../models/Customer.model");
const fetch = require("node-fetch");
const moment = require("moment");
const WatiMessagesModel = require("../models/WatiMessages.model");

const watiApiKey = process.env.WATI_API_KEY;
const watiApiHost = process.env.WATI_API_HOST;

let templateIds = {
  Yes: "facebook_yes",
  No: "feedback_no", 
};

exports.watiWebhookController = async (req, res) => {
  try {
    const { text, waId } = req.body;
    if (text === "Yes" || text === "No") {
      const customers = await CustomerModel.find({ watiId: waId });
      const customerIds = customers.map((c) => c._id);
      if (customerIds.length) {
        await WatiMessagesModel.updateOne(
          {
            customer: { $in: customerIds },
            response: "No response",
            createdAt: {
              $gte: moment().subtract(12, "hours").format(),
            },
          },
          {
            $set: { response: text },
          }
        );

        const data = {
          template_name: templateIds[text],
          broadcast_name: "Reply",
          receivers: [
            {
              whatsappNumber: waId,
            },
          ],
        };

        console.log(data);

        let response = await fetch(
          `${watiApiHost}/api/v1/sendTemplateMessages`,
          {
            method: "POST",
            body: JSON.stringify(data),
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${watiApiKey}`,
            },
          }
        );
        console.log(response);
      }
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: error.message,
      result: error,
    });
  }
};

exports.getWatiMessages = async (req, res) => {
  try {
    const { from, to } = req.query;
    let query = {};
    if (from) {
      query["createdAt"] = { $gte: moment(from).format() };
    }
    if (to) {
      if (query["createdAt"]) {
        query["createdAt"]["$lte"] = moment(to).format();
      } else {
        query["createdAt"] = { $lte: moment(to).format() };
      }
    }

    const messages = await WatiMessagesModel.find(query)
      .populate("customer", "firstName lastName email")
      .populate("teacher", "TeacherName")
      .populate("schedule", "className");

    const chart = messages.reduce((acc, message) => {
      let { teacher } = message; 
      if (acc[teacher.TeacherName]) {
        let prevCount = acc[teacher.TeacherName][message.response];
        acc[teacher.TeacherName] = {
          ...acc[teacher.TeacherName],
          [message.response]: prevCount ? prevCount + 1 : 1,
        };
      } else {
        acc[teacher.TeacherName] = { [message.response]: 1 };
      }
      return acc
    }, {});

    return res.status(200).json({ result: { messages, chart } });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: error.message,
      result: error,
    });
  }
};

// exports.addWatiContacts = async (req, res) => {
//   try {
//     const customersWithoutWatiContactId = await CustomerModel.find({
//       classStatusId: {
//         $in: ["113975223750050", "38493085684944", "155576230867877"],
//       },
//     })
//       .populate("timeZone")
//       .lean();

//     let addedMobileNumbers = [];
//     for (let i = 0; i < customersWithoutWatiContactId.length; i++) {
//       const customer = customersWithoutWatiContactId[i];
//       console.log(customer.firstName);

//       if (
//         customer.whatsAppnumber &&
//         !addedMobileNumbers.includes(customer.whatsAppnumber)
//       ) {
//         let data = {
//           name: `${customer.firstName ?? ""} (${customer.lastName ?? ""})`,
//           customParams: [],
//         };

//         if (customer?.timeZone?.timeZoneName) {
//           data.customParams.push({
//             name: "Timezone",
//             value: customer.timeZone.timeZoneName,
//           });
//         }
//         let formattedPhoneNumber = customer.whatsAppnumber
//           .replace(" ", "")
//           .replace("+", "");

//         if (customer.countryCode && formattedPhoneNumber.length <= 10) {
//           formattedPhoneNumber = customer.countryCode + formattedPhoneNumber;
//         }

// try {
// let response = await fetch(
//   `${watiApiHost}/api/v1/addContact/${formattedPhoneNumber}`,
//   {
//     method: "POST",
//     body: JSON.stringify(data),
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${watiApiKey}`,
//     },
//   }
// );
// response = await response.json();
// const { id } = response.contact;
//           await CustomerModel.updateMany(
//             { whatsAppnumber: customer.whatsAppnumber },
//             { $set: { watiId: formattedPhoneNumber } }
//           );
//           addedMobileNumbers.push(customer.whatsAppnumber);
//         } catch (error) {
//           console.log(
//             "Error while inserting: ",
//             customer.firstName,
//             error.message
//           );
//         }
//       }
//     }

//     return res.json({ success: true, result: customersWithoutWatiContactId });
//   } catch (error) {
//     console.log(error);
//     return res.status(500).json({
//       error: error.message,
//       result: error,
//     });
//   }
// };
