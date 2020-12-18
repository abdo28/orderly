var express = require("express");
var router  = express.Router();
var item = require("../models/item");
var order = require("../models/order");
var wholesale = require("../models/wholesale");


router.get("/", isLoggedIn,  async function(req, res){
    await order.find({recivedByCustomer:true, isTawseel:true, userOwner: res.locals.currentUser }).populate("items").exec( async function(err, foundOrders){
      if(err){
        console.log(err);
      } else {
        await order.find({recivedByCustomer:true,  extraForDelivery:0, userOwner: res.locals.currentUser}).populate("items").exec( async function(err, foundTasleem){
          if(err){
            console.log(err);
          } else {
            await wholesale.find({FullyPay:true, userOwner: res.locals.currentUser}).populate("items").exec( async function(err, foundWOrders){
              if(err){
                console.log(err);
              } else {
                await res.render("sale", {jomleh: foundWOrders, tawseel:foundOrders, tasleem:foundTasleem});
              }
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