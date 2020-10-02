var mongoose = require("mongoose");

var wholesaleItemSchema = new mongoose.Schema({
   type:String,
   priceToWholesalePerUnit:Integer,
   amount:Integer
});

module.exports = mongoose.model("wholesaleItem", wholesaleItemSchema);