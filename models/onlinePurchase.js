var mongoose = require("mongoose");

var onlinePurchaseSchema = new mongoose.Schema({
   number: Number,
   wholesalePriceUSD: Number,
   wholesalePriceILS: Number,
   retailPrice: Number,
   sourceURL: String, 
   dateOrdered: String, 
   dateArrived:String,
   arrived:Boolean
});

module.exports = mongoose.model("onlinePurchase", onlinePurchaseSchema);