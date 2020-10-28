var express = require("express");
var bodyParser  = require("body-parser");
//var methodOverride = require("method-override");
var mongoose = require("mongoose");
var passport  = require("passport");
const session = require('express-session');
var LocalStrategy = require("passport-local");
var catchAsync = require("./utils/catchAsync");


var warehouse = require("./models/warehouse");
var purchaseArchive = require("./models/purchaseArchive");
var item = require("./models/item");
var order = require("./models/order");
var wholesale = require("./models/wholesale");
var User = require("./models/user");
var itemsToBeOrdered=[];
app = express();
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true }));




// local mongod


mongoose.connect('mongodb://127.0.0.1:27017/orderly_v3', {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

const sessionConfig = {
  secret: 'thisshouldbeabettersecret!',
  resave: false,
  saveUninitialized: true,
  cookie: {
      httpOnly: true,
      expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
      maxAge: 1000 * 60 * 60 * 24 * 7
  }
}

app.use(session(sessionConfig))


app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(passport.initialize());
app.use(passport.session());


passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req,res, next){
	res.locals.currentUser = req.user;
	next(); 
});

//app.use(methodOverride("_method"));

// Landing
app.get("/", function(req,res){
    res.render("index");
}); 

// Auth routes

app.get("/register",function(req,res){
  res.render("register");
});

app.post("/register",catchAsync(async function(req, res, next){
  try{
    var {email, username, password} = req.body;
    var user = new User({email, username});
    var rUser = await User.register(user, password);
    req.login(rUser, function(err){
      if(err) return next(err);
      console.log(rUser);
      res.redirect("/purchase");
    });
   
  } catch(e){
    console.log(e);
    res.redirect("/register");
  }
  
}));

app.get("/login", function(req, res){
  res.render('login');
});

app.post("/login", passport.authenticate('local', {failureRedirect: '/login' }), function(req, res){
  res.redirect("/purchase");
});

app.get("/logout", function(req, res){
  req.logout();
  res.redirect("/");
});



//sale routs
app.get("/sale", isLoggedIn,  async function(req, res){
  
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
app.get("/wholesale", isLoggedIn, async  function(req, res){

  await wholesale.find({FullyPay:false}).populate("items").exec( async function(err, foundWOrders){
    if(err){
      console.log(err);
    } else {
      await res.render("wholesale", {jomleh: foundWOrders});
      
    }
  });
});

app.get("/wholesale/new",isLoggedIn, function(req, res){
  warehouse.find({}, function(err, allWarehouseItems){
    if(err){
        console.log(err);
    } else {
       res.render("wholesaleNew",{items:allWarehouseItems});
    }
 });
});

app.post("/wholesale/new", isLoggedIn,  async function(req, res){

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


app.post("/wholesale/:id",isLoggedIn,  async function(req, res){
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
app.get("/order",isLoggedIn, async  function(req, res){
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

app.get("/order/new", isLoggedIn, function(req, res){
  warehouse.find({}, function(err, allWarehouseItems){
    if(err){
        console.log(err);
    } else {
       res.render("orderNew",{items:allWarehouseItems});
    }
 });
});

app.post("/order/newOrder",isLoggedIn,  async function(req, res){
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

app.post("/order/:id",isLoggedIn,  async function(req, res){
 
  await order.findByIdAndUpdate(req.params.id,{ $set: {dateToCustomer:new Date(), recivedByCustomer:true }}, async function(err, ret){
      if(err){
        console.log(err);
      } else {
      await res.redirect("/order");
     }
 } );

    
 
});



// purchases routes
app.get("/purchase", isLoggedIn, function(req, res){
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

app.post("/purchase/newWarehouse", isLoggedIn, function(req, res){
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

app.get("/purchase/newArchive", isLoggedIn, function(req, res){
  warehouse.find({}, function(err, allWarehouseItems){
        if(err){
            console.log(err);
        } else {
           res.render("purchasArhiveNew",{items:allWarehouseItems});
        }
     });
});

app.post("/Archive", isLoggedIn, function(req, res){
  // get data from form and add to campgrounds array
  
  var purchaseArc = {
    type: req.body.type, 
    amount:req.body.amount, 
    wholesalePrice:req.body.wholesalePrice, 
    source:req.body.source, 
    dateDelivered:req.body.dateDelivered,
    notes:req.body.notes
  };

  purchaseArchive.create(purchaseArc, isLoggedIn, function(err, foundpur){
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

  function isLoggedIn(req, res, next){
    if(!req.isAuthenticated()){
      console.log("you must be loged in"+res.locals.currentUser );
      return res.redirect("/login");
    }
    next();
    
  }






app.listen(3000, '127.0.0.1', () => {
  console.log(`Server running at http://${'127.0.0.1'}:${3000}/`);
});