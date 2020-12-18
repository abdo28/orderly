var express = require("express");
var router  = express.Router();
var warehouse = require("../models/warehouse");
var item = require("../models/item");
var order = require("../models/order");

router.get("/",isLoggedIn, async  function(req, res){
    await order.find({recivedByCustomer:false, isTawseel:true,userOwner: res.locals.currentUser}).populate("items").exec( async function(err, foundOrders){
      if(err){
        console.log(err);
      } else {
        await order.find({recivedByCustomer:false,  extraForDelivery:0, userOwner: res.locals.currentUser}).populate("items").exec( async function(err, foundTasleem){
          if(err){
            console.log(err);
          } else {
            await res.render("order", {tawseel:foundOrders, tasleem:foundTasleem});
          }
        });
      }
    });
});
  
router.get("/new", isLoggedIn, function(req, res){
    warehouse.find({userOwner: res.locals.currentUser}, function(err, allWarehouseItems){
      if(err){
          console.log(err);
      } else {
         res.render("orderNew",{items:allWarehouseItems});
      }
   });
  });
  
router.post("/newOrder",isLoggedIn,  async function(req, res){
    var extra=0;
    var istaw=true;
    if(req.body.extraForDelivery =="no"){
      extra=0;
      istaw=false;
    } else if(req.body.extraForDelivery=="heb"){
      extra = 10;
    } else if(req.body.extraForDelivery=="wes"){
      extra = 20;
    } else if(req.body.extraForDelivery=="jer"){
      extra = 30;
    } else if(req.body.extraForDelivery=="isr"){
      extra = 70;
    }
    var fCost=0;
    var itemsToBeOrdered=[];
    for(var i=0; i<req.body.orderItem.length;i++){
        itemsToBeOrdered.push({
          itemAmount: req.body.orderItem[i].amount,
          itemType:req.body.orderItem[i].type,
          OriginalAmount:0,
          itemRetail:0,
          originalPrice:0
        });
    }
    var canAddOrder=true;
    // after this loop we know if we can proccede with this order, 
    for(var j=0;j<itemsToBeOrdered.length; j++){
      var itemsToBeOrderedjitemRetail=0;
      var itemsToBeOrderedjOriginalAmount=0; 
      var itemsToBeOrderedjitemAmount= itemsToBeOrdered[j].itemAmount;
      var itemsToBeOrderedjoriginalPrice=0;
      await  warehouse.findOne({type:itemsToBeOrdered[j].itemType,userOwner: res.locals.currentUser},async function(err, foundItem){
        if(err){
         await console.log(err);
        } else {
          console.log(foundItem);
          itemsToBeOrderedjitemRetail=foundItem.retailPrice;
          itemsToBeOrderedjOriginalAmount = foundItem.number;
          itemsToBeOrderedjoriginalPrice = foundItem.originalPrice;
          if((itemsToBeOrderedjitemAmount>foundItem.number)||(itemsToBeOrderedjOriginalAmount-itemsToBeOrderedjitemAmount<0)){
            canAddOrder=false;
            console.log("cant add element");
          }
          fCost+=(itemsToBeOrderedjitemRetail*itemsToBeOrderedjitemAmount)
        }
      });
      itemsToBeOrdered[j].itemRetail=itemsToBeOrderedjitemRetail;
      itemsToBeOrdered[j].OriginalAmount = itemsToBeOrderedjOriginalAmount;
      itemsToBeOrdered[j].originalPrice = itemsToBeOrderedjoriginalPrice;
    }
      if(canAddOrder){
        let ddate = req.body.dateToCompany;
        var ord = {
          personName: req.body.personName,
          //in case of Tasleem order the location and other delivery fields will be empty 
          personLocation: req.body.personLocation, 
          dateToCompany: ddate, 
          // for now it is date to company.
          dateToCustomer:ddate, 
          extraForDelivery:extra,
          discount:req.body.discount, 
          personNumber:req.body.personNumber,
          notes:req.body.notes,
          userOwner: res.locals.currentUser,
          recivedByCustomer:false,
          finalCost:((fCost +extra)-req.body.discount),
          items:[], 
          isTawseel:istaw
        };
  
        var ide ;
        await order.create(ord, async function(err, created){
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
          await item.create({type:itemsToBeOrdered[m].itemType, priceForEachOne:itemsToBeOrdered[m].itemRetail, amount:itemsToBeOrdered[m].itemAmount, originalPriceForEachOne:itemsToBeOrdered[m].originalPrice}, async function(err, createdItem){
            if(err){
              console.log(err);
            } else{
              try {
                await createdItem.save();
                await ite.push(createdItem);
            } catch(err) {
                console.log(err)
            }
            if(ite.length==il){
              console.log(ite);
              await order.findByIdAndUpdate(ide,  { $set:{ items:ite}}, async function(err, cr){
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
                      await warehouse.findOneAndUpdate({type:itemsToBeOrdered[k].itemType,userOwner: res.locals.currentUser},toBe, async function(err, updatedware){
                        if(err){
                          await console.log(err);
                        } else{
                         await console.log(updatedware);
                        }
                      });
                    }  
                  } catch(err) {
                    console.log(err);
                    await order.findByIdAndDelete(ide, async function(err){
                      if(err){
                        console.log(err);
                      } else{
                        console.log("deleted");
                      }
                    } )
                    res.redirect("/order/new");
                  }
                  if( isC==false){
                  isC=true;
                  await res.redirect("/order");
                } 
                }  
                });
            }
            }
          });
        }    
      } else {
      await  res.redirect("/order/new");
      }
}); 
  
router.post("/:id",isLoggedIn,  async function(req, res){
    await order.findByIdAndUpdate(req.params.id,{ $set: {dateToCustomer:new Date(), recivedByCustomer:true }}, async function(err, ret){
        if(err){
          console.log(err);
        } else {
        await res.redirect("/order");
       }
   } );
});
  
 
function isLoggedIn(req, res, next){
    if(!req.isAuthenticated()){
      console.log("you must be loged in"+res.locals.currentUser );
      return res.redirect("/login");
    }
    next();
}

module.exports = router;