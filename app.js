 if (proccess.env.NODE_ENV != "production"){
  require('dotenv').config()
 }
var express = require("express");
var bodyParser  = require("body-parser");
//var methodOverride = require("method-override");
var mongoose = require("mongoose");
var passport  = require("passport");
const session = require('express-session');
var LocalStrategy = require("passport-local");
var catchAsync = require("./utils/catchAsync");
const MongoStore = require('connect-mongo')(session);

var warehouse = require("./models/warehouse");
var purchaseArchive = require("./models/purchaseArchive");
var item = require("./models/item");
var order = require("./models/order");
var wholesale = require("./models/wholesale");
var User = require("./models/user");
app = express();
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true }));

//required routes
var saleRoutes = require("./routes/sale");
var wholesaleRoutes = require("./routes/wholesale");
var orderRoutes = require("./routes/order");
var purchaseRoutes = require("./routes/purchase");
var archiveRoutes = require("./routes/archive");
var mathRoutes = require("./routes/math");
var authRoutes = require("./routes/auth");


// local mongod
//'mongodb://127.0.0.1:27017/orderly_v3'
const DB_URL = process.env.DB_URL || 'mongodb://127.0.0.1:27017/orderly_v3';
mongoose.connect( DB_URL, {
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
const secret = process.env.SECRET || 'thisshouldbeabettersecret!';
const store = new MongoStore({
  url: DB_URL  ,
  secret: secret,
  touchAfter: 24*60*60
});
store.on("error", function(e){
  console.log("SESSION STORE ERROR", e);
})

const sessionConfig = {
  store,
  name: 'session',
  secret,
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

app.get("/", function(req,res){
    res.render("index");
}); 

app.use("/", authRoutes);
app.use("/sale", saleRoutes);
app.use("/wholesale", wholesaleRoutes);
app.use("/order", orderRoutes);
app.use("/purchase", purchaseRoutes);
app.use("/Archive", archiveRoutes);
app.use("/math", mathRoutes);
 
const port = proccess.env.PORT || 3000;
app.listen(port,  () => {
  console.log(`Server running at:${port}/`);
});