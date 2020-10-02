var mongoose = require("mongoose");

var offlinePurchesSchema = new mongoose.Schema({
   number: Integer,
   wholesalePrice: Integer,
   retailPrice: Integer,
   source: String,
   date: String
});

module.exports = mongoose.model("offlinePurches", offlinePurchesSchema);