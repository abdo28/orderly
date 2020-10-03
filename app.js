var express = require("express");
var bodyParser  = require("body-parser");
var onlineItems = require("./models/onlineItems");
var offlineItems  = require("./models/offlineItems");
var inPersonOrders = require("./models/inPersonOrders");
var deliveryOrders = require("./models/deliveryOrders");
var onlinePurchase = require("./models/onlinePurchase");
var wholesale = require("./models/wholesale");
var purchaseItem = require("./models/purchaseItems");
var mongoose = require("mongoose");

app = express();

// local mongod
mongoose.connect("mongodb://127.0.0.1:27017/orderly_v1" );
mongoose.set('useNewUrlParser', true);
mongoose.set('useUnifiedTopology', true);
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({extended: true}));



app.get("/", function(req,res){
    res.render("index");
    // Campground.find({}, function(err, allCampgrounds){
    //     if(err){
    //         console.log(err);
    //     } else {
    //        res.render("index",{campgrounds:allCampgrounds});
    //     }
    //  });
}); 

app.get("/purchase", function(req, res){
  onlinePurchase.find({}, function(err, onItems){
    if(err){
      console.log(err);
    } else {
      offlineItems.find({}, function(err, offItems){
        if(err){
          console.log(err);
        } else {
          res.render("purchase", {onlinePurchases:onItems, offline:offItems});
        }
      }) 
    }
  });
});

app.get("/purchase/newOnline", function(req, res){
  purchaseItem.find({}, function(err, allitems){
        if(err){
            console.log(err);
        } else {
           res.render("onlinePurchaseNew",{items:allitems});
        }
     });
});

app.post("/onlinePurch", function(req, res){
  // get data from form and add to campgrounds array
  
  var purchase = {
    sourceURL: req.body.sourceURL, 
    wholesalePriceUSD: req.body.wholesalePriceUSD,
    wholesalePriceILS: req.body.wholesalePriceILS,
    retailPrice: req.body.retailPrice,
    number:req.body.number,
    dateOrdered:req.body.dateOrdered,
    dateArrived:req.body.dateArrived
  };

  onlinePurchase.create(purchase, function(err, newpur){
    if(err){
      console.log(err);
    } else {
      res.redirect('/purchase');
    }
    });
  });




app.get("/purchase/newOffline");


app.post("/purchase/newitem", function(req, res){

  purchaseItem.create({type: req.body.newItem}, function(err, newly){
    if(err){
      console.log(err);
    } else {
      res.redirect("/purchase");
    }
  })
});


app.listen(3000, '127.0.0.1', () => {
  console.log(`Server running at http://${'127.0.0.1'}:${3000}/`);
});