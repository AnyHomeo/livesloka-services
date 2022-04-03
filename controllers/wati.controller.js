require("dotenv").config();
const CustomerModel = require("../models/Customer.model");
const fetch = require("node-fetch");

const watiApiKey = process.env.WATI_API_KEY;
const watiApiHost = process.env.WATI_API_HOST;

exports.watiWebhookController = async (req, res) => {
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

// exports.addWatiContacts = async (req, res) => {
//   try {
//     const customersWithoutWatiContactId = await CustomerModel.find({
//       watiContactId: { $exists: false },
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

//         try {
//           let response = await fetch(
//             `${watiApiHost}/api/v1/addContact/${formattedPhoneNumber}`,
//             {
//               method: "POST",
//               body: JSON.stringify(data),
//               headers: {
//                 "Content-Type": "application/json",
//                 Authorization: `Bearer ${watiApiKey}`,
//               },
//             }
//           );
//           response = await response.json();
//           const { id } = response.contact;
//           await CustomerModel.updateMany(
//             { whatsAppnumber: customer.whatsAppnumber },
//             { $set: { watiContactId: id } }
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
