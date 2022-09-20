const mongoose = require('mongoose');
const { rolePermissions } = require('../config/constants');

const RolesSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name of role is required'],
  },
  permissions: [
    {
      type: String,
      enum: {
        values: rolePermissions,
        message: '{VALUE} is not a valid permission',
      },
    },
  ],
});

module.exports = mongoose.model('Roles', RolesSchema);
