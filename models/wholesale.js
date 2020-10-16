var mongoose = require("mongoose");

var wholesaleSchema = new mongoose.Schema({
    personName: String, 
    personNumber:String, 
    personLocation:String,
    items:[
        { 
            type: mongoose.Schema.Types.ObjectId,
            ref: "item" 
         }
    ],
    dateToCompany:Date,
    datefullyPay:Date,
    finalCost:Number,
    WhatIsPayed:Number,
    discount:Number,
    FullyPay:Boolean,
    notes:String


});


module.exports = mongoose.model("wholesale",  wholesaleSchema);