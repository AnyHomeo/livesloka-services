const fetch = require("node-fetch");
const ZoomAccountModel = require("../models/ZoomAccount.model");
const ZoomAccount = require("../models/ZoomAccount.model");

module.exports.zoomlink = async (req, res) => {
  let timeSlotData = [];

  req.body.map((slot) => {
    timeSlotData.push(slot.split("!@#$%^&*($%^")[0]);
  });
  let token = "";
  let jwtId = "";
  let zoomEmail = "";
  let zoomPassword = "";
  try {
    const getJwtTokenDetails = await ZoomAccount.findOne({
      timeSlots: {
        $nin: timeSlotData,
      },
    });
    token = getJwtTokenDetails.zoomJwt;
    jwtId = getJwtTokenDetails._id;
    zoomEmail = getJwtTokenDetails.zoomEmail;
    zoomPassword = getJwtTokenDetails.zoomPassword;
  } catch (error) {
    console.log(error);
  }
  const formData = {
    topic: "Livesloka Online Class",
    type: 3,
    password: zoomPassword,
    settings: {
      host_video: true,
      participant_video: true,
      join_before_host: true,
      jbh_time: 0,
      mute_upon_entry: true,
      watermark: false,
      use_pmi: false,
      approval_type: 2,
      audio: "both",
      auto_recording: "none",
      waiting_room: false,
      meeting_authentication: false,
    },
  };

  fetch(`https://api.zoom.us/v2/users/${zoomEmail}/meetings`, {
    method: "post",
    body: JSON.stringify(formData),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })
    .then((res) => res.json())
    .then((json) => {
      if (json.code === 1001) {
        return res.status(400).json({
          message: "Error while creating meeting link",
        });
      }
      return res.status(200).json({
        message: "Meeting created successfully",
        result: { link: json.join_url, id: jwtId, email: zoomEmail },
      });
    })
    .catch((err) => console.log(err));
};

module.exports.zoomDetails = async (req, res) => {
  const id = req.params.id;

  try {
    const zoomaccountDetails = await ZoomAccountModel.findById(id);

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
