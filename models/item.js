var mongoose = require("mongoose");

var itemSchema = new mongoose.Schema({
   type:String,
   amount:Number
});

module.exports = mongoose.model("item", itemSchema);