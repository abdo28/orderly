var mongoose = require("mongoose");

var deliveryOrdersSchema = new mongoose.Schema({
   personName: String, 
   discount:Number,
   items:[
       { 
           type: mongoose.Schema.Types.ObjectId,
           ref: "item" 
        }
   ],
   extraForDelivery:Number,
   dateToCompany:String,
   dateToCustomer:String,
   recivedByCustomer:Boolean,
   note:String,

});

module.exports = mongoose.model("deliveryOrders", deliveryOrdersSchema);