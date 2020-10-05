var mongoose = require("mongoose");

var purchaseArchiveSchema = new mongoose.Schema({
   type: String, 
   amount:Number, 
   /* wholesale price is only in ILS */
   wholesalePrice:Number, 
   /* source could be actual person, or a url link to an online delivered products */
   source:String, 
   dateDelivered:Date,
   notes:String
   
});

module.exports = mongoose.model("purchaseArchive", purchaseArchiveSchema);