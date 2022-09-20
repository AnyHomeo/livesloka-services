const mongoose = require('mongoose');
const { Schema, model } = mongoose;
const CustomerMessageTemplateSchema = require('./CustomerMessageTemplates.model');

const Comments = new Schema(
  {
    // message: {
    //   type: Schema.Types.ObjectId,
    //   ref: "CustomerMessageTemplate",
    // },
    text: {
      type: String,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'Agent',
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
    },
    timeStamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = model('Comments', Comments);
