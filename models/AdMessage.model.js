const mongoose = require("mongoose");

const AdMessageSchema = new mongoose.Schema({
    adminIds: [{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Admin"
    }],
    background:String,
    message:String,
    id:Number,
    icon:String,
    title:String,
    isForAll:Boolean
},{
    timeStamps:true
});

module.exports = mongoose.model("AdMessages",AdMessageSchema);