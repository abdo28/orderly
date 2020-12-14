var mongoose = require("mongoose");

var itemSchema = new mongoose.Schema({
    type:String, 
    priceForEachOne:Number,
    amount:Number, 
    originalPriceForEachOne:Number,
    userOwner:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
     }
});

module.exports = mongoose.model("item", itemSchema);