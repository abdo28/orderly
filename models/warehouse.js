var mongoose = require("mongoose");

var warehouseSchema = new mongoose.Schema({
   type: String, 
   number:Number, 
   retailPrice:Number, 
   userOwner:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
   }
});

module.exports = mongoose.model("warehouse", warehouseSchema);