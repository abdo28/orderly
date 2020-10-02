var mongoose = require("mongoose");

var wholesaleSchema = new mongoose.Schema({
   companyName: String, 
   discount: Number,
   wholesaleItems:[
       { 
           type: mongoose.Schema.Types.ObjectId,
           ref: "wholesaleItem" 
        }
   ],
   dateOfSelling:String,
   amountPaied: Number, 
   isAllPaied:Boolean,
   note:String,
});

module.exports = mongoose.model("wholesale", wholesaleSchema);