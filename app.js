var express = require("express");
var bodyParser  = require("body-parser");
//var methodOverride = require("method-override");
var mongoose = require("mongoose");

var warehouse = require("./models/warehouse");
var purchaseArchive = require("./models/purchaseArchive");
var item = require("./models/item");
var order = require("./models/order");
var itemsToBeOrdered=[];
app = express();

// local mongod

mongoose.connect("mongodb://127.0.0.1:27017/orderly_v2", {useNewUrlParser: true, useUnifiedTopology: true }, (err) => {
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


//orders routs
app.get("/order",async  function(req, res){
  await order.find({recivedByCustomer:false, isTawseel:true}).populate("items").exec( async function(err, foundOrders){
    if(err){
      console.log(err);
    } else {
      await order.find({recivedByCustomer:false,  extraForDelivery:0}).populate("items").exec( function(err, foundTasleem){
        if(err){
          console.log(err);
        } else {
          res.render("order", {tawseel:foundOrders, tasleem:foundTasleem});
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
      


      var ord = {
        personName: req.body.personName,
        //in case of Tasleem order the location and other delivery fields will be empty 
        personLocation: req.body.personLocation, 
        dateToCompany: req.body.dateToCompany, 
        //dateToCustomer: to be decided when moved to sales,
        // for now it is date to company.
        dateToCustomer:req.body.dateToCompany, 
        extraForDelivery:extra,
        discount:req.body.discount, 
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
        item.create({type:itemsToBeOrdered[m].itemType, priceForEachOne:itemsToBeOrdered[m].itemRetail, amount:itemsToBeOrdered[m].itemAmount},  function(err, createdItem){
          if(err){
            console.log(err);
          }else{
            
            try {
              createdItem.save();
              ite.push(createdItem);
              if(m == itemsToBeOrdered.length){
                order.findByIdAndUpdate(ide,  { $set:{ items:ite}}, function(err, cr){
                  if(err){
                    console.log(err);
                  } else {
                  if( isC==false){
                    isC=true;
                    res.redirect("/order");
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
      res.redirect("/order/new");
    }
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