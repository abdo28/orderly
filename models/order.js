var mongoose = require("mongoose");

var orderSchema = new mongoose.Schema({
    personName: String, 
    personNumber:String, 
    personLocation:String,
    items:[
        { 
            type: mongoose.Schema.Types.ObjectId,
            ref: "item" 
         }
    ],
    extraForDelivery:Number,
    userOwner:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
     },
    dateToCompany:Date,
    dateToCustomer:Date,
    finalCost:Number,
    discount:Number,
    recivedByCustomer:Boolean,
    notes:String, 
    isTawseel:Boolean

});


module.exports = mongoose.model("order", orderSchema);