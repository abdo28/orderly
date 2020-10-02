var mongoose = require("mongoose");

var itemSchema = new mongoose.Schema({
   type:String,
   amount:Integer
});

module.exports = mongoose.model("item", itemSchema);