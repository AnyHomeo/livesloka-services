const mongoose = require('mongoose'); 

const videoCategorySchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        unique:true,
    },
});

module.exports = mongoose.model('VideoCategory', videoCategorySchema);