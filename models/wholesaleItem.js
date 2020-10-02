var mongoose = require("mongoose");

var wholesaleItemSchema = new mongoose.Schema({
   type:String,
   priceToWholesalePerUnit:Number,
   amount: Number
});

module.exports = mongoose.model("wholesaleItem", wholesaleItemSchema);