const mongoose = require('mongoose'); 

const videoSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
    },
    url:{
        type:String,
    },
    description:{
        type:String,
    },
    isPublic:{
        type:Boolean,
        default:false
    },
    image:{
        type:String,
    },
    category:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"VideoCategory"
    },
    assignedTo:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Admin"
    }]
},{timestamps:true});

module.exports = mongoose.model('Video', videoSchema);