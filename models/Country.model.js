const mongoose = require('mongoose');

var CountrySchema = new mongoose.Schema(
  {
    id: {
      type: String,
      trim: true,
    },
    countryDesc: {
      trim: true,
      type: String,
    },
    countryName: {
      trim: true,
      type: String,
    },
    countryStatus: {
      trim: true,
      type: String,
    },
    subjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Country', CountrySchema);
