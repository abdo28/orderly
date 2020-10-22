var express = require("express");
var bodyParser  = require("body-parser");
//var methodOverride = require("method-override");
var mongoose = require("mongoose");

var warehouse = require("./models/warehouse");
var purchaseArchive = require("./models/purchaseArchive");
var item = require("./models/item");
var order = require("./models/order");
var wholesale = require("./models/wholesale");
var itemsToBeOrdered=[];
app = express();

// local mongod

mongoose.connect("mongodb://127.0.0.1:27017/orderly_v3", {useNewUrlParser: true, useUnifiedTopology: true }, (err) => {
  if (err)
     console.error(err);
  else
     console.log("Connected to the mongodb"); 
});

mongoose.set('useNewUrlParser', true);
mongoose.set('useUnifiedTopology', true);
mongoose.set('useFindAndModify', false);
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({extended: true}));


//app.use(methodOverride("_method"));

// Landing
app.get("/", function(req,res){
    res.render("index");
}); 


//sale routs
app.get("/sale", async function(req, res){
  
  await order.find({recivedByCustomer:true, isTawseel:true}).populate("items").exec( async function(err, foundOrders){
    if(err){
      console.log(err);
    } else {
      await order.find({recivedByCustomer:true,  extraForDelivery:0}).populate("items").exec( async function(err, foundTasleem){
        if(err){
          console.log(err);
        } else {
          await wholesale.find({FullyPay:true}).populate("items").exec( async function(err, foundWOrders){
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
//wholesale routs
app.get("/wholesale", async  function(req, res){

  await wholesale.find({FullyPay:false}).populate("items").exec( async function(err, foundWOrders){
    if(err){
      console.log(err);
    } else {
      await res.render("wholesale", {jomleh: foundWOrders});
      
    }
  });
});

app.get("/wholesale/new",function(req, res){
  warehouse.find({}, function(err, allWarehouseItems){
    if(err){
        console.log(err);
    } else {
       res.render("wholesaleNew",{items:allWarehouseItems});
    }
 });
});

app.post("/wholesale/new",  async function(req, res){

  //var it=[];
  var fCost=0;

  itemsToBeOrdered=[];
  for(var i=0; i<req.body.orderItem.length;i++){
      itemsToBeOrdered.push({
        itemAmount: req.body.orderItem[i].amount,
        itemType:req.body.orderItem[i].type,
        OriginalAmount:0,
        itemRetail:req.body.orderItem[i].priceForEach
      });
  }
  console.log(itemsToBeOrdered);
  var canAddOrder=true;
  // after this loop we know if we can proccede with this order, 
  for(var j=0;j<itemsToBeOrdered.length; j++){
    var itemsToBeOrderedjitemRetail=itemsToBeOrdered[j].itemRetail;
    var itemsToBeOrderedjOriginalAmount=0; 
    var itemsToBeOrderedjitemAmount= itemsToBeOrdered[j].itemAmount;
    await  warehouse.findOne({type:itemsToBeOrdered[j].itemType}, function(err, foundItem){
      if(err){
        console.log(err);
      } else {
       // console.log(itemsToBeOrderedj);
        console.log(foundItem);
        
        itemsToBeOrderedjOriginalAmount = foundItem.number;

        if(itemsToBeOrderedjitemAmount>foundItem.number){
          canAddOrder=false;
          console.log("cant add element");
        }
        fCost+=(itemsToBeOrderedjitemRetail*itemsToBeOrderedjitemAmount)
      }
    });
    itemsToBeOrdered[j].OriginalAmount = itemsToBeOrderedjOriginalAmount
    console.log(itemsToBeOrdered[j]);
  }

    if(canAddOrder){
      for(var k=0; k<itemsToBeOrdered.length;k++){
        var toBe= {
          type:itemsToBeOrdered[k].itemType,
          number:itemsToBeOrdered[k].OriginalAmount-itemsToBeOrdered[k].itemAmount,
          retailPrice:itemsToBeOrdered[k].itemRetail
        };
        await warehouse.findOneAndUpdate({type:itemsToBeOrdered[k].itemType},{ $set:{ number:toBe.number}}, function(err, updatedware){
          if(err){
            console.log(err);
          } else{
            console.log(updatedware);
          }
        });
      }  
      

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
        FullyPay:false,
        finalCost:((fCost)-req.body.discount),
        items:[], 
        WhatIsPayed:0
      };

      // newwww
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
      for(var m=0; m<itemsToBeOrdered.length; m++){
        await item.create({type:itemsToBeOrdered[m].itemType, priceForEachOne:itemsToBeOrdered[m].itemRetail, amount:itemsToBeOrdered[m].itemAmount}, async function(err, createdItem){
          if(err){
            console.log(err);
          }else{
            
            try {
              createdItem.save();
              ite.push(createdItem);
              if(m == itemsToBeOrdered.length){
               await wholesale.findByIdAndUpdate(ide,  { $set:{ items:ite}}, async function(err, cr){
                  if(err){
                    console.log(err);
                  } else {
                  if( isC==false){
                    isC=true;
                    await res.redirect("/wholesale");
                  }
                  }  
                  });
              }
              
              
          } catch(err) {
              console.log("There was an error")
              console.log(err)
          }
           
          }
        } );

      }
    } else {
    await  res.redirect("/wholesale/new");
    }
}); 


app.post("/wholesale/:id", async function(req, res){
  await wholesale.findById(req.params.id,/* { $set:{ items:ite}},*/ async function(err, returned){
    if(err){
      console.log(err);
    } else {
     // req.body.money
     var returnedWhatIsPayed=returned.WhatIsPayed;
     var returnedfinalCost=returned.finalCost;
     if((returnedWhatIsPayed+Number(req.body.money))==returnedfinalCost){
        await wholesale.findByIdAndUpdate(req.params.id,{ $set: {datefullyPay:new Date(), FullyPay:true, WhatIsPayed: returnedfinalCost}}, async function(err, ret){
          if(err){
            console.log(err);
          } else {
            console.log(ret);
          }
        } );
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
      } );
     }
    await res.redirect("/wholesale");

    }
  });
});


//orders routs
app.get("/order",async  function(req, res){
  await order.find({recivedByCustomer:false, isTawseel:true}).populate("items").exec( async function(err, foundOrders){
    if(err){
      console.log(err);
    } else {
      await order.find({recivedByCustomer:false,  extraForDelivery:0}).populate("items").exec( async function(err, foundTasleem){
        if(err){
          console.log(err);
        } else {
          await res.render("order", {tawseel:foundOrders, tasleem:foundTasleem});
        }
      });
    }
  });
});

app.get("/order/new", function(req, res){
  warehouse.find({}, function(err, allWarehouseItems){
    if(err){
        console.log(err);
    } else {
       res.render("orderNew",{items:allWarehouseItems});
    }
 });
});

app.post("/order/newOrder", async function(req, res){
  //res.send(req.body)  

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
  //var it=[];
  var fCost=0;

  itemsToBeOrdered=[];
  for(var i=0; i<req.body.orderItem.length;i++){
      itemsToBeOrdered.push({
        itemAmount: req.body.orderItem[i].amount,
        itemType:req.body.orderItem[i].type,
        OriginalAmount:0,
        itemRetail:0
      });
  }
  console.log(itemsToBeOrdered);
  var canAddOrder=true;
  // after this loop we know if we can proccede with this order, 
  for(var j=0;j<itemsToBeOrdered.length; j++){
    var itemsToBeOrderedjitemRetail=0;
    var itemsToBeOrderedjOriginalAmount=0; 
    var itemsToBeOrderedjitemAmount= itemsToBeOrdered[j].itemAmount;
    await  warehouse.findOne({type:itemsToBeOrdered[j].itemType}, function(err, foundItem){
      if(err){
        console.log(err);
      } else {
       // console.log(itemsToBeOrderedj);
        console.log(foundItem);
        itemsToBeOrderedjitemRetail=foundItem.retailPrice;
        itemsToBeOrderedjOriginalAmount = foundItem.number;

        if(itemsToBeOrderedjitemAmount>foundItem.number){
          canAddOrder=false;
          console.log("cant add element");
        }
        fCost+=(itemsToBeOrderedjitemRetail*itemsToBeOrderedjitemAmount)
      }
    });
    itemsToBeOrdered[j].itemRetail=itemsToBeOrderedjitemRetail;
    itemsToBeOrdered[j].OriginalAmount = itemsToBeOrderedjOriginalAmount
    console.log(itemsToBeOrdered[j]);
  }

    if(canAddOrder){
      for(var k=0; k<itemsToBeOrdered.length;k++){
        var toBe= {
          type:itemsToBeOrdered[k].itemType,
          number:itemsToBeOrdered[k].OriginalAmount-itemsToBeOrdered[k].itemAmount,
          retailPrice:itemsToBeOrdered[k].itemRetail
        };
        await warehouse.findOneAndUpdate({type:itemsToBeOrdered[k].itemType},toBe, function(err, updatedware){
          if(err){
            console.log(err);
          } else{
            console.log(updatedware);
          }
        });
      }  
      

      let ddate = req.body.dateToCompany;
      var ord = {
        personName: req.body.personName,
        //in case of Tasleem order the location and other delivery fields will be empty 
        personLocation: req.body.personLocation, 
        dateToCompany: ddate, 
        //dateToCustomer: to be decided when moved to sales,
        // for now it is date to company.
        dateToCustomer:ddate, 
        extraForDelivery:extra,
        discount:req.body.discount, 
        personNumber:req.body.personNumber,
        notes:req.body.notes,
        recivedByCustomer:false,
        finalCost:((fCost +extra)-req.body.discount),
        items:[], 
        isTawseel:istaw
      };

      // newwww
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
      for(var m=0; m<itemsToBeOrdered.length; m++){
        await item.create({type:itemsToBeOrdered[m].itemType, priceForEachOne:itemsToBeOrdered[m].itemRetail, amount:itemsToBeOrdered[m].itemAmount}, async function(err, createdItem){
          if(err){
            console.log(err);
          }else{
            
            try {
              createdItem.save();
              ite.push(createdItem);
              if(m == itemsToBeOrdered.length){
               await order.findByIdAndUpdate(ide,  { $set:{ items:ite}}, async function(err, cr){
                  if(err){
                    console.log(err);
                  } else {
                  if( isC==false){
                    isC=true;
                    await res.redirect("/order");
                  } 
                  //cr.save();
                  }  
                  });
              }
              
              
          } catch(err) {
              console.log("There was an error")
              console.log(err)
          }
           
          }
        } );

      }
    } else {
    await  res.redirect("/order/new");
    }
}); 

app.post("/order/:id", async function(req, res){
 
  await order.findByIdAndUpdate(req.params.id,{ $set: {dateToCustomer:new Date(), recivedByCustomer:true }}, async function(err, ret){
      if(err){
        console.log(err);
      } else {
      await res.redirect("/order");
     }
 } );

    
 
});



// purchases routes
app.get("/purchase", function(req, res){
  warehouse.find({}, function(err, warehouseItems){
    if(err){
      console.log(err);
    } else {
      purchaseArchive.find({}, function(err, Archive){
        if(err){
          console.log(err);
        } else {
          res.render("purchase", {warehouseIte:warehouseItems, ArchiveItems:Archive});
        }
      }) 
    }
  });
});

app.post("/purchase/newWarehouse", function(req, res){
  var ware= {type:req.body.type, number:0, retailPrice:req.body.retailPrice };
  warehouse.find({type:ware.type}, function(err, ret){
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

app.get("/purchase/newArchive", function(req, res){
  warehouse.find({}, function(err, allWarehouseItems){
        if(err){
            console.log(err);
        } else {
           res.render("purchasArhiveNew",{items:allWarehouseItems});
        }
     });
});

app.post("/Archive", function(req, res){
  // get data from form and add to campgrounds array
  
  var purchaseArc = {
    type: req.body.type, 
    amount:req.body.amount, 
    wholesalePrice:req.body.wholesalePrice, 
    source:req.body.source, 
    dateDelivered:req.body.dateDelivered,
    notes:req.body.notes
  };

  purchaseArchive.create(purchaseArc, function(err, foundpur){
    if(err){
      console.log(err);
    } else {
      console.log(foundpur);

      warehouse.findOne({ type:foundpur.type }, function(err, ware){
          if(err){
            console.log(err);
          }else {
            warehouse.findOneAndUpdate({ type:foundpur.type }, { type:foundpur.type, number:(ware.number+foundpur.amount), retailPrice:ware.retailPrice }, function(err, result){
              console.log(ware);
              res.redirect('/purchase');
            });
          }
        }); 
    }
    });
  });




app.listen(3000, '127.0.0.1', () => {
  console.log(`Server running at http://${'127.0.0.1'}:${3000}/`);
});