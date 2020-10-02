var mongoose = require("mongoose");

var offlineItemsSchema = new mongoose.Schema({
   type: String, 
   offlinePurches:[
    {
       type: mongoose.Schema.Types.ObjectId,
       ref: "offlinePurches"
    }
 ]
});

module.exports = mongoose.model("offlineItems", offlineItemsSchema);