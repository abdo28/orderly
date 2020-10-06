var mongoose = require("mongoose");

var orderSchema = new mongoose.Schema({
    personName: String, 
    personLocation:String,
    items:[
        { 
            type: mongoose.Schema.Types.ObjectId,
            ref: "item" 
         }
    ],
    extraForDelivery:Number,
    dateToCompany:Date,
    dateToCustomer:Date,
    discount:Number,
    recivedByCustomer:Boolean,
    notes:String

});

module.exports = mongoose.model("order", orderSchema);