var mongoose = require("mongoose");

var onlineItemsSchema = new mongoose.Schema({
   type: String, 
   onlinePurchase:[
    {
       type: mongoose.Schema.Types.ObjectId,
       ref: 'onlinePurchase'
    }
 ]
});

module.exports = mongoose.model("onlineItems", onlineItemsSchema);