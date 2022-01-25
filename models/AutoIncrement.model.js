const mongoose = require('mongoose')

var CounterSchema = new mongoose.Schema({
    _id: {type: String, required: true},
    number: { type: Number, default: 0 }
});

module.exports = mongoose.model('counter', CounterSchema);