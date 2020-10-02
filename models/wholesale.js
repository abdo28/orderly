var mongoose = require("mongoose");

var wholesaleSchema = new mongoose.Schema({
   companyName: String, 
   discount:Integer,
   wholesaleItems:[
       { 
           type: mongoose.Schema.Types.ObjectId,
           ref: "wholesaleItem" 
        }
   ],
   dateOfSelling:String,
   amountPaied:Integer, 
   isAllPaied:Boolean,
   note:String,
});

module.exports = mongoose.model("wholesale", wholesaleSchema);