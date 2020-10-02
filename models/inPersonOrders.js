var mongoose = require("mongoose");

var inPersonOrdersSchema = new mongoose.Schema({
   personName: String, 
   discount:Integer,
   items:[
       { 
           type: mongoose.Schema.Types.ObjectId,
           ref: "item" 
        }
   ],
   dateToPlace:String,
   dateToCustomer:String,
   recivedByCustomer:Boolean,
   note:String,

});

module.exports = mongoose.model("inPersonOrders", inPersonOrdersSchema);