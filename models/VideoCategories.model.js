const mongoose = require('mongoose'); 

const videoCategorySchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        unique:true,
    },
    id:{
        type:String
    }
});

module.exports = mongoose.model('VideoCategory', videoCategorySchema);