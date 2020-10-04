var mongoose = require("mongoose");

var inPersonOrdersSchema = new mongoose.Schema({
   personName: String, 
   discount: Number,
   items:[
     { 
           type: mongoose.Schema.Types.ObjectId,
           ref: 'Item' 
        }
      ]
   ,
   dateToPlace:String,
   dateToCustomer:String,
   recivedByCustomer:Boolean,
   note:String,

});

module.exports = mongoose.model("inPersonOrders", inPersonOrdersSchema);