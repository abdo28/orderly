var mongoose = require("mongoose");

var purchaseItemSchema = new mongoose.Schema({
   type:String,
});

module.exports = mongoose.model("purchaseItem", purchaseItemSchema);