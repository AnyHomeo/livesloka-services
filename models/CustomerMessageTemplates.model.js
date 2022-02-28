const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const CustomerMessageTemplateSchema = new Schema(
  {
    text: {
      type: String,
      trim: true,
    },
    id: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = model(
  "CustomerMessageTemplate",
  CustomerMessageTemplateSchema
);
