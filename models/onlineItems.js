var mongoose = require("mongoose");

var offlineItemsSchema = new mongoose.Schema({
   type: String, 
   onlinePurches:[
    {
       type: mongoose.Schema.Types.ObjectId,
       ref: "onlinePurches"
    }
 ]
});

module.exports = mongoose.model("onlineItems", onlineItemsSchema);