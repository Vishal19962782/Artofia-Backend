const mongoose=require('mongoose');

const Event=new mongoose.Schema({
    eventName:{type:String,required:true},
    eventOwner:{type:mongoose,ref:"User"},
    noOfTickets:{type:Number,required:true},
    eventDate:{type:Date,required:true},

    eventAddress:{type:String,required:true},
    contactNumber:{type:Number,required:true},
    addedDate:{type:Date,default:new Date.now()},
    ticketPrice:{type:Number,required:true},
    eventDescription:{type:String,required:true},
    eventImage:{type:String,required:true},
})