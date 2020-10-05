var mongoose = require("mongoose");

var warehouseSchema = new mongoose.Schema({
   type: String, 
   number:Number, 
   retailPrice:Number
});

module.exports = mongoose.model("warehouse", warehouseSchema);