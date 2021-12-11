const moment = require("moment");
const momentTZ = require("moment-timezone");

module.exports = {
  lessThanOrEqualToMinusTwo: {
    numberOfClassesBought: {
      $lte: -2,
    },
    classStatusId: "113975223750050",
    autoDemo: {
      $ne: true,
    },
  },
  equalToMinusOne: {
    numberOfClassesBought: -1,
    classStatusId: "113975223750050",
    autoDemo: {
      $ne: true,
    },
  },
  equalToZero: {
    numberOfClassesBought: 0,
    classStatusId: "113975223750050",
    autoDemo: {
      $ne: true,
    },
  },
  demo: {
    classStatusId: "38493085684944",
  },
  new: {
    classStatusId: "108731321313146850",
  },
  inClass: {
    classStatusId: "113975223750050",
  },
  autoDemo: {
    autoDemo: true,
  },
  pastDueDate: () => ({
    paidTill: { $lte: momentTZ().tz("Asia/Kolkata").startOf("day").format() },
  }),
  dueDateToday: () => ({
    paidTill: {
      $gte: momentTZ().tz("Asia/Kolkata").startOf("day").format(),
      $lte: momentTZ().tz("Asia/Kolkata").endOf("day").format(),
    },
  }),
};
