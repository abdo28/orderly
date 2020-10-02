var mongoose = require("mongoose");

var offlinePurchaseSchema = new mongoose.Schema({
   number: Integer,
   wholesalePrice: Integer,
   retailPrice: Integer,
   source: String,
   date: String
});

module.exports = mongoose.model("offlinePurchase", offlinePurchaseSchema);