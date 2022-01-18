const { rolePermissions } = require("../config/constants");

exports.getAllPermissions = (_, res) => {
  try {
    return res.json({
      result: rolePermissions,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      result: error,
    });
  }
};
