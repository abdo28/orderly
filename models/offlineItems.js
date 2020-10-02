var mongoose = require("mongoose");

var offlineItemsSchema = new mongoose.Schema({
   type: String, 
   offlinePurchase:[
    {
       type: mongoose.Schema.Types.ObjectId,
       ref: "offlinePurchase"
    }
 ]
});

module.exports = mongoose.model("offlineItems", offlineItemsSchema);