var mongoose = require("mongoose");

var offlinePurchaseSchema = new mongoose.Schema({
   number: Number,
   wholesalePrice: Number,
   retailPrice: Number,
   source: String,
   date: String
});

module.exports = mongoose.model("offlinePurchase", offlinePurchaseSchema);