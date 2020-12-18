var express = require("express");
var router  = express.Router();
var warehouse = require("../models/warehouse");
var item = require("../models/item");
var wholesale = require("../models/wholesale");

router.get("/", isLoggedIn, async  function(req, res){
    await wholesale.find({FullyPay:false,userOwner: res.locals.currentUser}).populate("items").exec( async function(err, foundWOrders){
      if(err){
        console.log(err);
      } else {
        await res.render("wholesale", {jomleh: foundWOrders});
      }
    });
});
  
router.get("/new",isLoggedIn, function(req, res){
    warehouse.find({userOwner: res.locals.currentUser}, function(err, allWarehouseItems){
      if(err){
          console.log(err);
      } else {
         res.render("wholesaleNew",{items:allWarehouseItems});
      }
   });
});
  
router.post("/new", isLoggedIn,  async function(req, res){
    var fCost=0;
    var itemsToBeOrdered=[];
    for(var i=0; i<req.body.orderItem.length;i++){
        itemsToBeOrdered.push({
          itemAmount: req.body.orderItem[i].amount,
          itemType:req.body.orderItem[i].type,
          OriginalAmount:0,
          itemRetail:req.body.orderItem[i].priceForEach,
          originalPrice:0
  
        });
    }
    var canAddOrder=true;
    // after this loop we know if we can proccede with this order, 
    for(var j=0;j<itemsToBeOrdered.length; j++){
      var itemsToBeOrderedjitemRetail=itemsToBeOrdered[j].itemRetail;
      var itemsToBeOrderedjOriginalAmount=0; 
      var itemsToBeOrderedjitemAmount= itemsToBeOrdered[j].itemAmount;
      var itemsToBeOrderedjoriginalPrice=0;
      await  warehouse.findOne({type:itemsToBeOrdered[j].itemType,userOwner: res.locals.currentUser}, function(err, foundItem){
        if(err){
          console.log(err);
        } else {
          itemsToBeOrderedjOriginalAmount = foundItem.number;
          itemsToBeOrderedjoriginalPrice = foundItem.originalPrice;
          if((itemsToBeOrderedjitemAmount>foundItem.number)||(itemsToBeOrderedjOriginalAmount-itemsToBeOrderedjitemAmount<0)){
            canAddOrder=false;
            console.log("cant add element");
          }
          fCost+=(itemsToBeOrderedjitemRetail*itemsToBeOrderedjitemAmount)
        }
      });
      itemsToBeOrdered[j].OriginalAmount = itemsToBeOrderedjOriginalAmount
      itemsToBeOrdered[j].originalPrice = itemsToBeOrderedjoriginalPrice;  
    }
      if(canAddOrder){
        let ddate = req.body.dateToCompany;
        var who = {
          personName: req.body.personName,
          personNumber:req.body.personNumber,
          personLocation: req.body.personLocation, 
          dateToCompany: ddate, 
          // date to be updated when fully pay
          datefullyPay:ddate, 
          discount:req.body.discount, 
          notes:req.body.notes,
          userOwner: res.locals.currentUser,
          FullyPay:false,
          finalCost:((fCost)-req.body.discount),
          items:[], 
          WhatIsPayed:0
        };
  
        var ide ;
        await wholesale.create(who, async function(err, created){
          if(err){
            console.log(err);
          } else {
            ide=created._id;
           console.log(created);
          }
        });
        var isC=false;
        var ite=[];
        var il=itemsToBeOrdered.length;
        for(var m=0; m<itemsToBeOrdered.length; m++){
          await item.create({type:itemsToBeOrdered[m].itemType, priceForEachOne:itemsToBeOrdered[m].itemRetail, amount:itemsToBeOrdered[m].itemAmount,originalPriceForEachOne:itemsToBeOrdered[m].originalPrice}, async function(err, createdItem){
            if(err){
              console.log(err);
            }else{
              try {
                await createdItem.save();
                await ite.push(createdItem);
              } catch(err) {
                console.log(err)
              }
              if(ite.length==il){
                console.log(ite); 
                await wholesale.findByIdAndUpdate(ide,  { $set:{items:ite}}, async function(err, cr){
                  if(err){
                    console.log(err);
                  } else {
                    console.log(ite);
                    try {
                      await cr.save();
                      for(var k=0; k<itemsToBeOrdered.length;k++){
                        var toBe= {
                          type:itemsToBeOrdered[k].itemType,
                          number:itemsToBeOrdered[k].OriginalAmount-itemsToBeOrdered[k].itemAmount,
                          retailPrice:itemsToBeOrdered[k].itemRetail,
                          originalPrice:itemsToBeOrdered[k].originalPrice,
                          userOwner: res.locals.currentUser
                        };
                        await warehouse.findOneAndUpdate({type:itemsToBeOrdered[k].itemType, userOwner: res.locals.currentUser},{ $set:{ number:toBe.number}}, function(err, updatedware){
                          if(err){
                            console.log(err);
                          } else{
                            console.log(updatedware);
                          }
                        });
                      }  
                    } catch(err) {
                      console.log(err)
                      await wholesale.findByIdAndDelete(ide, async function(err){
                        if(err){
                          console.log(err);
                        } else{
                          console.log("deleted");
                        }
                      });
                      res.redirect("/wholesale/new");
                    }
                    
                  if( isC==false){
                    isC=true;
                    await res.redirect("/wholesale");
                  }
                  }  
                  });
              }
            }
          });
        }
      } else {
      await  res.redirect("/wholesale/new");
      }
}); 
  
router.post("/:id",isLoggedIn,  async function(req, res){
    await wholesale.findById(req.params.id, async function(err, returned){
      if(err){
        console.log(err);
      } else {
       var returnedWhatIsPayed=returned.WhatIsPayed;
       var returnedfinalCost=returned.finalCost;
       if((returnedWhatIsPayed+Number(req.body.money))==returnedfinalCost){
          await wholesale.findByIdAndUpdate(req.params.id,{ $set: {datefullyPay:new Date(), FullyPay:true, WhatIsPayed: returnedfinalCost}}, async function(err, ret){
            if(err){
              console.log(err);
            } else {
              console.log(ret);
            }
          });
       } else if((returnedWhatIsPayed+Number(req.body.money) ) > returnedfinalCost){
          console.log("cant be done "+ (returnedWhatIsPayed+Number(req.body.money)));
       } else {
         var summ=returnedWhatIsPayed+Number(req.body.money);
        await wholesale.findByIdAndUpdate(req.params.id,{ $set: {WhatIsPayed:summ }}, async function(err, ret){
          if(err){
            console.log(err);
          } else {
            console.log(ret);
          }
        });
       }
      await res.redirect("/wholesale");
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