var express = require("express");
var router  = express.Router();
var warehouse = require("../models/warehouse");
var purchaseArchive = require("../models/purchaseArchive");

router.get("/", isLoggedIn, function(req, res){
    warehouse.find({userOwner: res.locals.currentUser}, function(err, warehouseItems){
      if(err){
        console.log(err);
      } else {
        purchaseArchive.find({userOwner: res.locals.currentUser}, function(err, Archive){
          if(err){
            console.log(err);
          } else {
            res.render("purchase", {warehouseIte:warehouseItems, ArchiveItems:Archive});
          }
        }) 
      }
    });
});
  
router.post("/newWarehouse", isLoggedIn, function(req, res){
    var ware= {type:req.body.type, number:0, retailPrice:req.body.retailPrice,originalPrice: req.body.originalPrice,userOwner: res.locals.currentUser };
    warehouse.find({type:ware.type,userOwner: res.locals.currentUser}, function(err, ret){
      if(err){
        console.log(err);
      } else {
        if(ret.length){
          //'النوع الذي تحاول إضافته موجود مسبقا'
          res.redirect("/purchase");
        } else {
          warehouse.create(ware, function(err, newly){
            if(err){
              console.log(err);
            } else {
              console.log(newly);
              res.redirect("/purchase");
            }
          });
        }
      }
    });
});
  
router.get("/newArchive", isLoggedIn, function(req, res){
    warehouse.find({userOwner: res.locals.currentUser}, function(err, allWarehouseItems){
          if(err){
              console.log(err);
          } else {
             res.render("purchasArhiveNew",{items:allWarehouseItems});
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