const mongoose = require('mongoose');

var StatusSchema = new mongoose.Schema({
    statusId: {
        type: String,

    },
    statusDesc: {
        type: String,
    },
    statusName: {
        type: String,
    },
});

module.exports = mongoose.model('Status', StatusSchema);
