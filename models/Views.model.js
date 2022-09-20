const { Schema, model } = require('mongoose');

const ViewsSchema = new Schema(
  {
    id: {
      type: String,
    },
    query: {
      type: Schema.Types.Mixed,
    },
    sortBy: {
      type: String,
    },
    isAsc: {
      type: Boolean,
      default: true,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = model('Views', ViewsSchema);
