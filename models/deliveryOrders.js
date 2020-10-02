var mongoose = require("mongoose");

var deliveryOrdersSchema = new mongoose.Schema({
   personName: String, 
   discount:Integer,
   items:[
       { 
           type: mongoose.Schema.Types.ObjectId,
           ref: "item" 
        }
   ],
   extraForDelivery:Integer,
   dateToCompany:String,
   dateToCustomer:String,
   recivedByCustomer:Boolean,
   note:String,

});

module.exports = mongoose.model("deliveryOrders", deliveryOrdersSchema);