const fetch = require("node-fetch");
const ZoomAccountModel = require("../models/ZoomAccount.model");
const ZoomAccount = require("../models/ZoomAccount.model");

module.exports.zoomlink = async (req, res) => {
  let timeSlotData = [];

  req.body.map((slot) => {
    timeSlotData.push(slot.split("!@#$%^&*($%^")[0]);
  });
  console.log(timeSlotData);
  let token = "";
  let jwtId = "";
  try {
    const getJwtTokenDetails = await ZoomAccount.findOne({
      timeSlots: {
        $nin: timeSlotData,
      },
    });
    token = getJwtTokenDetails.zoomJwt;
    jwtId = getJwtTokenDetails._id;
  } catch (error) {
    console.log(error);
  }
  const formData = {
    topic: "Meeting",
    password: "12345",
  };

  fetch("https://api.zoom.us/v2/users/srisaikamal2000@gmail.com/meetings", {
    method: "post",
    body: JSON.stringify(formData),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })
    .then((res) => res.json())
    .then((json) => {
      console.log(json);
      if (json.code === 1001) {
        return res.status(400).json({
          message: "Error while creating meeting link",
        });
      }
      return res.status(200).json({
        message: "Meeting created successfully",
        result: { link: json.join_url, id: jwtId },
      });
    })
    .catch((err) => console.log(err));
};

module.exports.zoomDetails = async (req, res) => {
  const id = req.params.id;

  try {
    const zoomaccountDetails = await ZoomAccountModel.findById(id);
    console.log(zoomaccountDetails);

    if (zoomaccountDetails === null) {
      return res.status(400).json({
        message: "Not found",
        result: zoomaccountDetails,
      });
    } else
      return res.status(200).json({
        message: "Retrived successfully",
        result: zoomaccountDetails,
      });
  } catch (error) {
    console.log(error);
  }
};
