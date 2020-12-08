const Admin = require("../models/Admin.model");

exports.getSettings = (req, res) => {
  const { id } = req.params;
  Admin.findById(id)
    .then((data) => {
      if (data.settings) {
        return res.status(200).json({
          message: "settings retrieved successfully",
          result: data.settings,
        });
      } else {
        data.settings = {};
        data.save().then((docs) => {
          return res.status(200).json({
            message: "new settings retrieved successsfully",
            result: {},
          });
        });
      }
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).json({
        error: "error in retrieving settings",
      });
    });
};

exports.updateSettings = (req, res) => {
  const { id } = req.params;
  Admin.findById(id)
    .select("settings")
    .then((data) => {
      if (data.settings) {
        data.settings = { ...data.settings, ...req.body };
        data
          .save()
          .then((data) => {
            return res.status(200).json({
              message: "settings updated successfully",
            });
          })
          .catch((err) => {
            console.log(err);
            return res.status(500).json({
              error: "error in updating settings",
            });
          });
      } else {
        data.settings = { ...req.body };
        data
          .save()
          .then((data) => {
            return res.status(200).json({
              message: "settings updated successfully",
            });
          })
          .catch((err) => {
            console.log(err);
            return res.status(500).json({
              error: "error in updating settings",
            });
          });
      }
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).json({
        error: "error in updating settings",
      });
    });
};
