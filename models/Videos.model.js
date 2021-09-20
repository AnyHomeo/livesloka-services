const mongoose = require('mongoose'); 

const videoSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
    },
    url:{
        type:String,
        required:true,
    },
    description:{
        type:String,
    },
    isPublic:{
        type:Boolean,
        default:false
    },
    category:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"VideoCategory"
    }
},{timestamps:true});

module.exports = mongoose.model('Video', videoSchema);