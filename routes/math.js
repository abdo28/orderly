var express = require("express");
var router  = express.Router();


var warehouse = require("../models/warehouse");
var order = require("../models/order");
var wholesale = require("../models/wholesale");

router.get("/",isLoggedIn, async function(req, res){
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
                 warehouse.find({userOwner: res.locals.currentUser}, async function(err, allWarehouseItems){
                  if(err){
                      console.log(err);
                  } else {
                    var type="";
                      if(allWarehouseItems.length>0){
                          type = allWarehouseItems[0].type;
                      }
                    let netRev = 0;
                    let itemrev=0;
                    for(var i=0; i<foundOrders.length; i++){
                      
                      for(var j=0;j<foundOrders[i].items.length;j++){
                        if(foundOrders[i].items[j].type==type)
                          itemrev+= (foundOrders[i].items[j].priceForEachOne- foundOrders[i].items[j].originalPriceForEachOne)*foundOrders[i].items[j].amount;
                          netRev+= (foundOrders[i].items[j].priceForEachOne- foundOrders[i].items[j].originalPriceForEachOne)*foundOrders[i].items[j].amount;
                      }
                      netRev-=foundOrders[i].discount;
                    }

                    for(var i=0; i<foundWOrders.length; i++){
                      for(var j=0;j<foundWOrders[i].items.length;j++){
                        if(foundWOrders[i].items[j].type==type)
                        itemrev+= (foundWOrders[i].items[j].priceForEachOne- foundWOrders[i].items[j].originalPriceForEachOne)*foundWOrders[i].items[j].amount;
                        netRev+= (foundWOrders[i].items[j].priceForEachOne- foundWOrders[i].items[j].originalPriceForEachOne)*foundWOrders[i].items[j].amount;
                      }     
                      netRev-=foundWOrders[i].discount;         
                    }

                    for(var i=0; i<foundTasleem.length; i++){
                      for(var j=0;j<foundTasleem[i].items.length;j++){
                        if(foundTasleem[i].items[j].type==type)
                        itemrev+= (foundTasleem[i].items[j].priceForEachOne- foundTasleem[i].items[j].originalPriceForEachOne)*foundTasleem[i].items[j].amount;
                        netRev+= (foundTasleem[i].items[j].priceForEachOne- foundTasleem[i].items[j].originalPriceForEachOne)*foundTasleem[i].items[j].amount;
                      }
                      netRev-=foundTasleem[i].discount;
                    }
                    console.log(itemrev);
                  await res.render("math", {rev:netRev, items:allWarehouseItems,itemre:itemrev, foundOrders:foundOrders, foundTasleem:foundTasleem, foundWOrders:foundWOrders});
              }
              });
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
  