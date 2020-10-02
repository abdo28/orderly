var mongoose = require("mongoose");

var onlinePurchesSchema = new mongoose.Schema({
   number: Integer,
   wholesalePriceUSD: Integer,
   wholesalePriceILS: Integer,
   retailPrice: Integer,
   sourceURL: String, 
   dateOrdered: String, 
   dateArrived:String,
   arrived:Boolean
});

module.exports = mongoose.model("onlinePurches", onlinePurchesSchema);