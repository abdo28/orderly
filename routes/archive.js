var express = require("express");
var router  = express.Router();
var warehouse = require("../models/warehouse");
var purchaseArchive = require("../models/purchaseArchive");


router.post("/", isLoggedIn, function(req, res){
    // get data from form and add to campgrounds array
    var purchaseArc = {
      type: req.body.type, 
      amount:req.body.amount, 
      wholesalePrice:req.body.wholesalePrice, 
      source:req.body.source, 
      dateDelivered:req.body.dateDelivered,
      notes:req.body.notes,
      userOwner: res.locals.currentUser
    };
    purchaseArchive.create(purchaseArc, function(err, foundpur){
      if(err){
        console.log(err);
      } else {
        console.log(foundpur);
  
        warehouse.findOne({ type:foundpur.type,userOwner: res.locals.currentUser }, function(err, ware){
            if(err){
              console.log(err);
            }else {
              warehouse.findOneAndUpdate({ type:foundpur.type,userOwner: res.locals.currentUser }, { type:foundpur.type, number:(ware.number+foundpur.amount), retailPrice:ware.retailPrice,userOwner: res.locals.currentUser }, function(err, result){
                console.log(ware);
                res.redirect('/purchase');
              });
            }
          }); 
      }
      });
    });


function isLoggedIn(req, res, next){
    if(!req.isAuthenticated()){
      console.log("you must be loged in"+res.locals.currentUser );
      return res.redirect("/login");
    }
    next();
}

module.exports = router;